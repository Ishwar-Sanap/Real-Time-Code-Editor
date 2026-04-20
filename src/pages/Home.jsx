import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { FaCrown } from "react-icons/fa";

export default function Home() {
  const [roomID, setRoomID] = useState(sessionStorage.getItem("roomID") || "");
  const [userName, setUserName] = useState(
    sessionStorage.getItem("userName") || "",
  );
  const navigate = useNavigate();
  const isHostUserRef = useRef(false);

  const createNewRoom = (e) => {
    e.preventDefault();

    const id = uuidv4();
    setRoomID(id);

    toast.success("New Room Created");

    //User who creates the room will be the Host..
    isHostUserRef.current = true;
  };

  const joinRoom = (e) => {
    if (roomID.length === 0 || userName.length === 0) {
      toast.error("Room ID & User Name is required");
      return;
    }

    //Store user name and room ID in session storage so, when you came back to home page values can be restored.
    sessionStorage.setItem("userName", userName);
    sessionStorage.setItem("roomID", roomID);

    //To avoid duplicates user's we will store userName and UniqueID
    const userID = uuidv4();
    sessionStorage.setItem("user", JSON.stringify({ userName, userID }));

    if (isHostUserRef.current) sessionStorage.setItem("hostUser", userID);

    //Redirect to the editor page with roomID
    navigate(`/editor/${roomID}`, {
      state: {
        userName,
      },
    });
  };

  const handleInputEnter = (e) => {
    // Check if the key pressed is Enter
    if (e.key == "Enter") {
      joinRoom(e);
    }
  };

  const handleRoomIdChange = (roomId) => {
    isHostUserRef.current = false;
    sessionStorage.removeItem("hostUser");
    setRoomID(roomId);
  };

  return (
    <div>
      <div className="home-container">
        <div className="form-container">
          <h2>Real Time Code Collaboration ✨</h2>

          <h4>Paste Invitation Room ID</h4>

          <div className="input-group">
            <input
              type="text"
              placeholder="Room ID"
              className="input-field"
              onChange={(e) => handleRoomIdChange(e.target.value)}
              value={roomID}
              onKeyUp={handleInputEnter}
            />
            <input
              type="text"
              placeholder="User Name"
              className="input-field"
              onChange={(e) => setUserName(e.target.value)}
              value={userName}
              onKeyUp={handleInputEnter}
            />
            <button onClick={joinRoom} className="btn join-btn">
              Join
            </button>

            <span className="create-info">
              If you don't have an invite then create room as
              <a
                onClick={createNewRoom}
                className="new-room-btn"
                href="/editor/new"
              >
                Host
                <span className="home-page-crown" title="Host">
                  <FaCrown />
                </span>
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
