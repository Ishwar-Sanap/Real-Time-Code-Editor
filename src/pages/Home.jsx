import React from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

export default function Home() {
  const [roomID, setRoomID] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();

    const id = uuidv4();
    setRoomID(id);

    toast.success("New Room Created");
  };

  const joinRoom = (e) => {
    if (roomID.length === 0 || userName.length === 0) {
      toast.error("Room ID & User Name is required");
      return;
    }

    //Redirect to the editor page with roomID
    navigate(`/editor/${roomID}`, {
      state: {
        userName,
      },
    });
  };
  
  const handleInputEnter = (e)=>{
    // Check if the key pressed is Enter
    if(e.key == "Enter"){
      joinRoom(e);
    }
  }

  return (
    <div>
      <div className="home-container" >
        
         {/* <div className="home-img-container">
          <img className="home-img" src="../public/home_page.png" alt="Home Page" />
        </div> */}

        <div className="form-container" >
          <img src="./" alt="Real time code synch up" />

          <h4>Paste Invitation Room ID</h4>

          <div className="input-group">
            <input
              type="text"
              placeholder="Room ID"
              className="input-field"
              onChange={(e) => setRoomID(e.target.value)}
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
              If you don't have an invite then create a new room
              <a
                onClick={createNewRoom}
                className="new-room-btn"
                href="/editor/new"
              >
                Here
              </a>
            </span>

          </div>

        </div>
    
      </div>
    </div>
  );
}
