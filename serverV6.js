import { Server } from "socket.io";
import * as Y from "yjs";
import {
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
  Awareness,
} from "y-protocols/awareness";
import { createServer } from "http";
import ACTIONS from "./src/actions.js";

const server = createServer();
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // roomID -> { ydoc, awareness }  To store the respective doc in the room
const roomTimers = new Map(); // roomID -> timeoutId

const allClients = {}; //{ roomID: [ {socketID, userName, ...}, ... ] }
const roomMessages = {}; // { roomID: [ {text, sender, time}, ... ] }

function getRoom(roomID) {
  if (!rooms.has(roomID)) {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    rooms.set(roomID, { ydoc, awareness });
  }
  return rooms.get(roomID);
}

io.on("connection", (socket) => {
  socket.on("yjs:join", ({ roomID, userDetails }) => {
    socket.join(roomID);

    if (!allClients[roomID]) allClients[roomID] = []; // creating empty array
    const defaultPermission =
      userDetails.userRole === "host"
        ? { read: true, write: true, execute: true }
        : { read: true, write: false, execute: false };

    allClients[roomID].push({
      socketID: socket.id,
      userName: userDetails.userName,
      userID: userDetails.userID,
      role: userDetails.userRole,
      permission: defaultPermission,
    });

    // if user's join the room again before cleanup time then stop the timer
    if (roomTimers.has(roomID)) {
      clearTimeout(roomTimers.get(roomID));
      roomTimers.delete(roomID);
    }
    const { ydoc, awareness } = getRoom(roomID);

    // io.to(roomID) which emits to all clients sockets in the room
    io.to(roomID).emit(ACTIONS.JOINED, {
      clients: allClients[roomID],
      socketID: socket.id,
      userDetails,
    });

    // Send doc snapshot that stored in server, to newely connected client.
    const state = Y.encodeStateAsUpdate(ydoc);
    socket.emit("yjs:sync", Array.from(state)); //emit sync doc to update UI of current connected client socket.

    // Send all awareness states
    const awarenessStates = awareness.getStates();
    if (awarenessStates.size > 0) {
      const update = encodeAwarenessUpdate(
        awareness,
        Array.from(awarenessStates.keys()),
      );
      socket.emit("yjs:awareness", Array.from(update)); // emit awareness to update UI of current connected client socket.
    }
  });

  // Broadcast doc updates to other clients in the room
  socket.on("yjs:update", ({ roomID, update }) => {
    const { ydoc } = getRoom(roomID);
    Y.applyUpdate(ydoc, new Uint8Array(update)); // update the document at server side also
    socket.to(roomID).emit("yjs:update", update); // emit doc update to clients that are in the room, to update UI
  });

  socket.on("yjs:awareness", ({ roomID, update }) => {
    const { awareness } = getRoom(roomID);
    applyAwarenessUpdate(awareness, new Uint8Array(update), socket.id); // update awareness for server side doc
    socket.to(roomID).emit("yjs:awareness", update); // emit awareness update to clients that are in the room, to update UI
  });

  // Manage Permissoins
  socket.on(
    ACTIONS.UPDATE_PERMISSIONS,
    ({ socketID, newPermission, roomID }) => {
      const roomClients = allClients[roomID] || [];

      // get reference to the client who's permission want to update
      const reqClient = roomClients.find(
        (client) => client.socketID === socketID,
      );
      if (reqClient)
        reqClient.permission = { ...reqClient.permission, ...newPermission };

      socket
        .to(roomID)
        .emit(ACTIONS.DATA_PERMISSIONS, { socketID, newPermission });
    },
  );

  //Listen for the Chat Message
  socket.on(ACTIONS.CHAT_MSG, ({ roomID, text, sender, time }) => {
    //If roomID not there then, add
    if (!roomMessages[roomID]) roomMessages[roomID] = [];

    roomMessages[roomID].push({ text, sender, time });

    //BroadCast the message to all connected clients in room
    socket.in(roomID).emit(ACTIONS.CHAT_MSG, { text, sender, time });
  });

  socket.on(ACTIONS.SYNC_CHATS, ({ roomID, socketID }) => {
    const messages = roomMessages[roomID] || [];
    io.to(socketID).emit(ACTIONS.CHAT_MSG_SYNC, { messages });
  });

  socket.on(ACTIONS.USER_TYPING, ({ roomID, userName }) => {
    socket.in(roomID).emit(ACTIONS.USER_TYPING, { userName });
  });

  socket.on(ACTIONS.USER_STOP_TYPING, ({ roomID, userName }) => {
    socket.in(roomID).emit(ACTIONS.USER_STOP_TYPING, { userName });
  });
  //Runs before Socket.IO removes the socket from rooms.
  socket.on("disconnecting", () => {
    rooms.forEach((value, roomID) => {
      const userName = allClients[roomID]?.filter(
        (client) => client.socketID === socket.id,
      )[0]?.userName;

      if (userName) {
        socket.to(roomID).emit(ACTIONS.DISCONNECTED, {
          socketID: socket.id,
          userName,
        });

        // remove that client from allClients
        allClients[roomID] = allClients[roomID]?.filter(
          (client) => client.socketID !== socket.id,
        );

        //delete the room if no any user's exists
        if (allClients[roomID]?.length === 0) {
          delete allClients[roomID];
        }
      }
    });
  });

  // When a client disconnects from the server, removes their cursor/presence from all rooms and notifies other users.
  socket.on("disconnect", () => {
    rooms.forEach(({ awareness }, roomID) => {
      const clientStates = awareness.getStates();
      // Check if this client was in this room's awareness
      if (clientStates.has(socket.id)) {
        // Remove the client's state
        removeAwarenessStates(awareness, [socket.id], null);

        // Encode and broadcast the removal
        const update = encodeAwarenessUpdate(awareness, [socket.id]);
        io.to(roomID).emit("yjs:awareness", Array.from(update));
      }
    });

    // cleanup room after 5mins.
    scheduleRoomCleanup();
  });
});

function scheduleRoomCleanup() {
  rooms.forEach((room, roomID) => {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomID);

    // Room is now empty
    if (!socketsInRoom || socketsInRoom.size === 0) {
      // Cancel any existing timer
      if (roomTimers.has(roomID)) {
        clearTimeout(roomTimers.get(roomID));
      }

      // Set new 5-minute timer
      const timerId = setTimeout(
        () => {
          // Double-check it's still empty
          const stillEmpty = !io.sockets.adapter.rooms.get(roomID);

          if (stillEmpty) {
            room.awareness.destroy();
            room.ydoc.destroy();
            rooms.delete(roomID);
            delete roomMessages[roomID];
            roomTimers.delete(roomID);
          }
        },
        5 * 60 * 1000,
      ); // 5 minutes

      roomTimers.set(roomID, timerId); // set timer to delete room after 5mins
    }
  });
}
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
