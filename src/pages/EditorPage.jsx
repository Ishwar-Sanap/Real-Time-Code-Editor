import React, { useEffect, useState, useRef } from "react";
import Client from "../components/Clients";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../actions";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import Spinner from "../components/Spinner";
import SideBar from "../components/SideBar/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { addClient , removeClient } from "../redux/slices/clientsSlice";
import {SocketContext , useSocket} from "../contexts/SocketContext"
import { MessagesContext } from "../contexts/MessagesContext";
import { CodeContext } from "../contexts/CodeContext";

export default function EditorPage() {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const [code, setCode] = useState("");

  const [messages, setMessages] = useState([])

  // useLocation is used to get the state passed from Home component
  const location = useLocation();

  const connectedClients = useSelector((state) => state.connectedClients.clients) //Get the state from store..
  console.log("connectedClients : ", connectedClients)

  const dispatch = useDispatch(); //returns — The dispatch function from the Redux store.


  console.log("userName : ", location.state?.userName);
  // useNavigate is used to navigate to different routes
  const reactNavigator = useNavigate();

  // useParams is used to get the roomID from the URL
  const { roomID } = useParams();
  const myUserName = sessionStorage.getItem("userName");
  const hostUser = sessionStorage.getItem("hostUser");

  const [loading, setLoading] = useState(true);

  const handleErrors = (err) => {
    console.log("Socket Error", err);
    toast.error("Socket connection failed, try again later!");
    setLoading(false);
    reactNavigator("/");
  };

  // Initialize the socket connection and set up event listeners
  // This function is called when the component mounts
  const init = async () => {
    try {
      // Initialize the socket connection
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      //Send the JOIN event to the server with roomID and userName
      socketRef.current.emit(ACTIONS.JOIN, {
        roomID,
        userName: location.state?.userName,  //  location.state.userName : is the name of the user who just joined
        userRole : myUserName === hostUser ? "host" : "guest"
      });

      // Listen for the JOINED event to get the list of clients in the room
      socketRef.current.on(ACTIONS.JOINED, ({ clients, userName, socketID }) => {
        //If new user joined the room, show a toast notification to all clients
        // except the user who currently joined
        console.log(`${userName} has joined the room`);

        if (userName !== location.state?.userName) {
          toast.success(`${userName} has joined the room`);
        }

        // Update the clients list state, on UI
        // setClinets(clients); // commented for testing
        console.log("Dispatching the clients :", clients);
        dispatch(addClient(clients))
        setLoading(false);
        //When user joins the Room Synch the Code and Messages from server
        socketRef.current.emit(ACTIONS.SYNC_CODE, {roomID, socketID});
      });

      // Listen for the DISCONNECTED event to remove the client from the list
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketID, userName }) => {  
        toast.error(`${userName} has left the room`);
        dispatch(removeClient(socketID));
      });
    } catch (err) {
      handleErrors(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log("EditorPage mounted");
    
    init();

    // Clean up the socket connection on unmount
    return () => {
      if (socketRef.current)
      {
        //cleaning the event listeners
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("Socket disconnected");
      }

    };

  }, []);

  // If location.state is not present, redirect to Home page
  if (!location.state) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <Spinner />
    );
  }


  return (
    <div className="editor-container">
      
      <SocketContext.Provider value={socketRef}>
      <CodeContext.Provider value={{ codeRef,code, setCode}}>
      <MessagesContext.Provider value={{messages , setMessages}}>
        <SideBar/>
      </MessagesContext.Provider>

      <div className="editor-panel">
        <Editor roomID = {roomID} />
      </div>
      </CodeContext.Provider>
      </SocketContext.Provider>
    </div>
  );
}
