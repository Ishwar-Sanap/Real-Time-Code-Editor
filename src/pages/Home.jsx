import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaCrown, FaCode, FaUsers, FaLightbulb } from "react-icons/fa";

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

    toast.success("New Room Created! Share the ID with your team.");

    //User who creates the room will be the Host..
    isHostUserRef.current = true;
  };

  const joinRoom = (e) => {
    e.preventDefault();

    if (roomID.length === 0 || userName.length === 0) {
      toast.error("Room ID & User Name are required");
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
    if (e.key === "Enter") {
      joinRoom(e);
    }
  };

  const handleRoomIdChange = (roomId) => {
    isHostUserRef.current = false;
    sessionStorage.removeItem("hostUser");
    setRoomID(roomId);
  };

  return (
    <div className="home-container">
      <div className="home-wrapper">
        {/* Left Section - Hero Content */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Code Together
              <br />
              <span className="gradient-text">In Real-Time</span>
            </h1>
            <p className="hero-description">
              Collaborate with your team on code instantly. Write, review, and
              chat together with seamless synchronization.
            </p>

            {/* Features */}
            <div className="features-grid">
              <div className="feature-card">
                <FaCode className="feature-icon" />
                <h3>Live Editing</h3>
                <p>
                  See live changes and cursor positions instantly
                </p>
              </div>
              <div className="feature-card">
                <FaUsers className="feature-icon" />
                <h3>Team Collaboration</h3>
                <p>Multiple users in one coding session</p>
              </div>
              <div className="feature-card">
                <FaLightbulb className="feature-icon" />
                <h3>Smart Features</h3>
                <p>
                  Syntax highlighting, Role-based access control
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Join a Room</h2>
              <p>Start collaborating with your team</p>
            </div>

            <form onSubmit={joinRoom} className="login-form">
              <div className="form-group">
                <label htmlFor="userName">Your Name</label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Enter your name"
                  className="input-field"
                  onChange={(e) => setUserName(e.target.value)}
                  value={userName}
                  onKeyUp={handleInputEnter}
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomID">Room ID</label>
                <input
                  id="roomID"
                  type="text"
                  placeholder="Paste the room ID"
                  className="input-field"
                  onChange={(e) => handleRoomIdChange(e.target.value)}
                  value={roomID}
                  onKeyUp={handleInputEnter}
                />
              </div>

              <button type="submit" className="btn join-btn">
                Join Room
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button onClick={createNewRoom} className="btn create-btn">
              <FaCrown className="crown-icon" />
              Create New Room
            </button>

            <p className="form-footer">
              New to collaboration? Create a room and invite your team members
              to get started!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
