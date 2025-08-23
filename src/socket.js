import {io} from 'socket.io-client';

export const initSocket = async()=>{
    const options = {
        forceNew: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        transports: ['websocket'],
    };

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

    //io is a function that creates a new socket connection
    //It takes the URL of the server and options as parameters and 
    // returns a new socket instance connected to the socket url server.
   
    let socketInstance = io(SOCKET_URL, options);
    return socketInstance;
}