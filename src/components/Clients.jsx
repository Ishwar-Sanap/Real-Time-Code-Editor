import React from "react";
import Avatar from "react-avatar";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../contexts/SocketContext";
import { setClient } from "../redux/slices/clientsSlice";

export default function Clients() {
  const { roomID } = useParams();
  const reactNavigator = useNavigate();
  const dispatch = useDispatch();

  const connectedClients = useSelector(
    (state) => state.connectedClients.clients,
  ); //get connected clinets from store
  const hostUser = sessionStorage.getItem("hostUser");
  const socketRef = useSocket();
  async function handleCopyRoomID() {
    try {
      await navigator.clipboard.writeText(roomID);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy Room ID");
    }
  }

  function handleLeaveRoom() {
    // Navigate back to Home page
    socketRef.current.disconnect();
    socketRef.current = null;
    reactNavigator("/");
    dispatch(setClient([]));
  }
  const user = connectedClients.filter((client) => client.role === "host")[0];

  return (
    <div className="clients-container">
      <h3 className="panel-heading">Connected Clients</h3>
      {user && (
        <div className="host-userDetails">
          <Avatar name={user.userName} size={50} round="15px" />
          <div className="host-info">
            <span>Host User : {user.userName}</span>
          </div>
        </div>
      )}
      <div className="client-list">
        {connectedClients.map((client) => (
          <div className="client" key={client.socketID}>
            <Avatar name={client.userName} size={50} round="15px" />
            <span className="client-name">{client.userName}</span>
          </div>
        ))}
      </div>

      <div className="action-btns">
        <button onClick={handleCopyRoomID} className="btn copy-btn">
          Copy Room ID
        </button>
        <button onClick={handleLeaveRoom} className="btn leave-btn">
          Leave
        </button>
      </div>
    </div>
  );
}
