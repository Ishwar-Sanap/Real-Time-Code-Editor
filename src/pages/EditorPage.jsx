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
import SideBar from "../components/sidebar/SideBar";

export default function EditorPage() {
  const socketRef = useRef(null);
  const codeRef = useRef(null);

  // useLocation is used to get the state passed from Home component
  const location = useLocation();

  console.log("userName : ", location.state?.userName);
  // useNavigate is used to navigate to different routes
  const reactNavigator = useNavigate();

  // useParams is used to get the roomID from the URL
  const { roomID } = useParams();

  const [clients, setClinets] = useState([
    { socketID: 1, userName: "User 1" },
    { socketID: 2, userName: "User 2" },
    { socketID: 3, userName: "User 3" },
    { socketID: 4, userName: "User 4" },
    { socketID: 5, userName: "User 5" },
    { socketID: 6, userName: "User 6" },
    { socketID: 7, userName: "User 7" },
    { socketID: 8, userName: "User 8" },
    { socketID: 9, userName: "User 9" },
    { socketID: 10, userName: "User 10" },


  ]);
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
         setLoading(false);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {code : codeRef.current, socketID});
      });

      // Listen for the DISCONNECTED event to remove the client from the list
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketID, userName }) => {  
        toast.error(`${userName} has left the room`);
        setClinets((prev) => {
          return prev.filter((client) => client.socketID !== socketID);
        });
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
     
      {/* <div className="left-panel">
        <div className="logo">
          <img src="/" alt="logo of code editor" className="logo-img" />
        </div>

        <h3>Connected </h3>

        <div className="client-list">
          {clients.map((client) => (
            <Client key={client.socketID} userName={client.userName} />
          ))}
        </div>

        <div className="action-btns">
          <button onClick= {handleCopyRoomID} className="btn copy-btn">Copy Room ID</button>
          <button onClick={handleLeaveRoom} className="btn leave-btn">Leave</button>
        </div>
      </div> */
      }

      {/* Adding Sidebar component */}

      <SideBar connectedClients={clients} />

      <div className="editor-panel">
        <Editor socketRef= {socketRef} roomID = {roomID} onCodeChange = {(code)=> codeRef.current = code}/>
      </div>

      {/* <div className="chat-panel">
        <h3>chat goes here</h3>
      </div> */}
    </div>
  );
}
