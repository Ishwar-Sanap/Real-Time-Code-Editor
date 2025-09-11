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

//Store messages for each room
const roomMessages = {} // { roomID: [ {text, sender, time}, ... ] }

//Store code for each room
const roomCodes = {}

// Get all clients in the room and 
const getConnectedClients = (roomID) => {
 return Array.from(io.sockets.adapter.rooms.get(roomID) || []).map((socketID) => {
    return {
      socketID,
      userName: userSocketMap[socketID],
    };
  });

}

//Event listener for socket connection, when a new socket connects event is triggered
io.on('connection', (socket) => {
    console.log(`new socket is connected: ${socket}`);
    console.log(`Socket connected: ${socket.id}`); 

    //When a user joins a room, we listen for the JOIN event at the server
    socket.on(ACTIONS.JOIN, ({roomID, userName})=>{
        userSocketMap[socket.id] = userName;
        
        //Join the socket to the room
        socket.join(roomID);

        const clients = getConnectedClients(roomID);

        clients.forEach(({socketID})=>{

          // Emit the JOINED event to all clients in the room, so all get notified new user has joined  
          io.to(socketID).emit(ACTIONS.JOINED, {
                clients,
                userName,  // userName : is the name of the user who just joined
                socketID: socket.id, // socket.id : the id of the socket that just joined
            });
        });

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

    //Runs before Socket.IO removes the socket from rooms.
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomID) => {
          // Emit the DISCONNECTED event to all clients in the room, so all get notified user has left
          socket.in(roomID).emit(ACTIONS.DISCONNECTED, {
            socketID: socket.id,
            userName: userSocketMap[socket.id],
          });

          const remaining = ( io.sockets.adapter.rooms.get(roomID)?.size || 0)-1;
          console.log("remaining user ", remaining);
          if (remaining === 0) {
            console.log(`Cleaning up room ${roomID}`);
            delete roomMessages[roomID];
            delete roomCodes[roomID];
          }
        });

        delete userSocketMap[socket.id];
    });

});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});