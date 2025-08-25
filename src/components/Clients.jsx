import React from "react";
import Avatar from "react-avatar";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

export default function Clients() {
  const { roomID } = useParams();
  const reactNavigator = useNavigate();

  const connectedClients = useSelector((state)=> state.connectedClients.clients); //get connected clinets from store
  console.log("clinets in Clinet comp : ", connectedClients);

  async function handleCopyRoomID() {
    try {
      await navigator.clipboard.writeText(roomID);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy Room ID");
    }
  }

  function handleLeaveRoom() {
    console.log("Leaving room:", roomID);
    // Navigate back to Home page
    reactNavigator("/");
  }

  return (
    <div className="clients-container">
      <h3 className="panel-heading">Connected Clients</h3>

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
