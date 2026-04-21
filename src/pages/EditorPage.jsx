import React, { useEffect, useState, useRef } from "react";
import Client from "../components/Clients";
// import Editor from "../components/Editor";
import Editor from "../components/EditorV6";
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
import { useDispatch, useSelector } from "react-redux";
import { setClient, removeClient } from "../redux/slices/clientsSlice";
import { SocketContext, useSocket } from "../contexts/SocketContext";
import { MessagesContext } from "../contexts/MessagesContext";
import { CodeContext } from "../contexts/CodeContext";
import { useYjsDoc } from "../hooks/UseyjsDoc.js";

export default function EditorPage() {
  // const socketRef = useRef(null);
  const codeRef = useRef(null);
  const [code, setCode] = useState("");

  const [messages, setMessages] = useState([]);

  // useLocation is used to get the state passed from Home component
  const location = useLocation();

  const connectedClients = useSelector(
    (state) => state.connectedClients.clients,
  ); //Get the state from store..

  const dispatch = useDispatch(); //returns — The dispatch function from the Redux store.

  // useNavigate is used to navigate to different routes
  const reactNavigator = useNavigate();

  // useParams is used to get the roomID from the URL
  const { roomID } = useParams();
  const { userName, userID } = JSON.parse(sessionStorage.getItem("user"));

  const hostUser = sessionStorage.getItem("hostUser");

  const [loading, setLoading] = useState(true);
  const { yText, awareness, socketRef, status } = useYjsDoc(roomID, setLoading);

  const handleErrors = (err) => {
    toast.error("Socket connection failed, try again later!");
    setLoading(false);
    dispatch(setClient([]))
    reactNavigator("/");
  };

  useEffect(() => {
    if (socketRef.current) {
      setLoading(false);

    }
  }, [socketRef.current]);

  // If location.state is not present, redirect to Home page
  if (!location.state) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="editor-container">
      <SocketContext.Provider value={socketRef}>
        <CodeContext.Provider value={{ codeRef, code, setCode }}>
          <MessagesContext.Provider value={{ messages, setMessages }}>
            <SideBar />
          </MessagesContext.Provider>

          <div className="editor-panel">
            <Editor yText={yText} awareness={awareness} />
          </div>
        </CodeContext.Provider>
      </SocketContext.Provider>
    </div>
  );
}
