import express from 'express';
const app = express();
import { createServer, get } from 'http';
import { Server } from 'socket.io';
import ACTIONS from './src/actions.js';

//Create an Express server
const server = createServer(app);

//creating a new instance of socket.io server
//This will allow us to use socket.io with the express server
const io = new Server(server);


//This will store the user name of each socket
const userSocketMap = {};

const allClients = {}; //{ roomID: [ {socketID, userName, ...}, ... ] }

//Store messages for each room
const roomMessages = {} // { roomID: [ {text, sender, time}, ... ] }

//Store code for each room
const roomCodes = {}

const cleanupTimers = {}

//Event listener for socket connection, when a new socket connects event is triggered
io.on('connection', (socket) => {

    //When a user joins a room, we listen for the JOIN event at the server
    socket.on(ACTIONS.JOIN, ({roomID, userName, userRole})=>{
        userSocketMap[socket.id] = userName;
        
        if(!allClients[roomID]) allClients[roomID] = []

        const defaultPermission =
          userRole === "host"
            ? { read: true, write: true, execute: true }
            : { read: true, write: false, execute: false };

        allClients[roomID].push({
          socketID: socket.id,
          userName,
          role: userRole,
          permission: defaultPermission,
        })

        //Join the socket to the room
        socket.join(roomID);
        
        if(cleanupTimers[roomID]){ 
          clearTimeout(cleanupTimers[roomID]);
          delete cleanupTimers[roomID];
        }

        allClients[roomID].forEach((client)=>{
           io.to(client.socketID).emit(ACTIONS.JOINED, {
              clients:allClients[roomID], userName, socketID: socket.id,
           })
        })
    })

    //Listen the code change event at the server
    socket.on(ACTIONS.CODE_CHANGE, ({roomID, code}) =>{
      if(!roomCodes[roomID]) roomCodes[roomID] = [];

      roomCodes[roomID] = code;

      //Code change event will be broadcast to all connected clients
      socket.in(roomID).emit(ACTIONS.CODE_CHANGE ,{code})
    })

    //Listen for the SYNC_CODE event at the server
    socket.on(ACTIONS.SYNC_CODE, ({roomID, socketID}) =>{
        //This will emit the SYNC_CODE event to the specific socket
        //This is used to sync the code with the new user who just joined
        const codeInEditor = roomCodes[roomID] || "// Your code goes here..";

        io.to(socketID).emit(ACTIONS.CODE_CHANGE, {code : codeInEditor});
    })

    socket.on(ACTIONS.UPDATE_PERMISSIONS,({ socketID, newPermission, roomID }) => {
      const roomClients = allClients[roomID] || [];
    
      // get reference to the client who's permission want to update
      const reqClient = roomClients.find((clinet) => clinet.socketID === socketID); 
      if(reqClient) reqClient.permission = {...reqClient.permission, ...newPermission};

      socket.in(roomID).emit(ACTIONS.DATA_PERMISSIONS, {socketID, newPermission});
    }
    );
    socket.on(ACTIONS.CURSOR_POS_SYNC, ({userName,roomID, cursor,randomColor})=>{
        socket.in(roomID).emit(ACTIONS.CURSOR_POS_SYNC, {userName ,cursor,randomColor}) //socket.in(roomID) which emits to all clinets except sender
    })

    //Listen for the Chat Message
    socket.on(ACTIONS.CHAT_MSG, ({roomID,text, sender, time})=>{

      //If roomID not there then, add 
      if(!roomMessages[roomID]) roomMessages[roomID] = [];

      roomMessages[roomID].push({text, sender, time});

      //BroadCast the message to all connected clients in room
      socket.in(roomID).emit(ACTIONS.CHAT_MSG , {text, sender, time})
    })

    socket.on(ACTIONS.SYNC_CHATS, ({roomID , socketID}) =>{
      const messages = roomMessages[roomID] || [] ;
       io.to(socketID).emit(ACTIONS.CHAT_MSG_SYNC, {messages});
    } )

    socket.on(ACTIONS.USER_TYPING, ({roomID, userName})=>{
      socket.in(roomID).emit(ACTIONS.USER_TYPING, {userName})
    })

    socket.on(ACTIONS.USER_STOP_TYPING, ({roomID, userName})=>{
      socket.in(roomID).emit(ACTIONS.USER_STOP_TYPING, {userName})
    })
    
    //Runs before Socket.IO removes the socket from rooms.
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((roomID) => {
        // Emit the DISCONNECTED event to all clients in the room, so all get notified user has left
        socket.in(roomID).emit(ACTIONS.DISCONNECTED, {
          socketID: socket.id,
          userName: userSocketMap[socket.id],
        });
        const remaining = (io.sockets.adapter.rooms.get(roomID)?.size || 0) - 1;
        if (remaining === 0) {
          // Delay cleanup by 3s
          cleanupTimers[roomID] = setTimeout(() => {
            const stillRemaining = io.sockets.adapter.rooms.get(roomID)?.size || 0;
            if (stillRemaining === 0) {
              delete roomMessages[roomID];
              delete roomCodes[roomID];
            }
            delete cleanupTimers[roomID];
          }, 3000);
        }
      });

      delete userSocketMap[socket.id];

      Object.keys(allClients).forEach((roomID) => {
        allClients[roomID] = allClients[roomID].filter(
          (client) => client.socketID !== socket.id
        );
        // delete the room if empty:
        if (allClients[roomID].length === 0) delete allClients[roomID];
      });

    });


});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});