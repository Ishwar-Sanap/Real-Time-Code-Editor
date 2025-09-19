import React, { useState, useRef, useEffect } from "react";
import Clients from "../Clients";
import "./SideBar.css";
import Chat from "../chats/Chat";
import { PiCodeSimpleFill } from "react-icons/pi";
import { VscFiles } from "react-icons/vsc";
import { FaPlay } from "react-icons/fa";
import { BsChatSquareTextFill  } from "react-icons/bs";
import { FaUsers } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";
import { FaShareAlt } from "react-icons/fa";
import Settings from "../settings/Settings";
import CodeRunner from "../coderunner/CodeRunner";


const panels = [
  { key: "run", icon: <FaPlay size={"25px"}/>, label: "Run" },
  { key: "chats", icon: <BsChatSquareTextFill  size={"25px"}/>, label: "Chats" },
  { key: "clients", icon: <FaUsers size={"25px"}/>, label: "Clients" },
  { key: "settings", icon:<IoSettingsSharp size={"25px"}/>, label: "Settings" },
];

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState();
  const [width, setWidth] = useState(350);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  const startResize = (e) => {
    isResizing.current = true;
    document.body.style.cursor = "e-resize";
    sidebarRef.current.classList.add("resizing");
  };

  const stopResize = () => {
    isResizing.current = false;
    document.body.style.cursor = "";
    sidebarRef.current?.classList.remove("resizing");
  };

  const handlePanelContent = (panel) => {
    // if the clicked panel is already active, close it
    if (activePanel === panel.key) {
      setActivePanel(null);
    }
    // else set the clicked panel as active
    else setActivePanel(panel.key);
  };
  const renderActivePanelContent = () => {
    if(activePanel == 'clients'){
      return <Clients/>;
    }
    else if(activePanel == 'chats'){
      return <Chat/>
    }
    else if(activePanel == 'settings'){
      return <Settings/>
    }
    else if(activePanel == 'run'){
      return <CodeRunner/>
    }
      
  }

  const handleResize = (e) => {
    if (isResizing.current) {
      setWidth(
        Math.max(
          150,
          e.clientX - sidebarRef.current.getBoundingClientRect().left
        )
      );
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, []);

  return (
    <div className="sidebar-container">
      

      <div className="sidebar-icons">
        <div className="logo">
          {/* <img src="/" alt="Logo" className="logo-img" /> */}
         <PiCodeSimpleFill type="regular" size={"30px"} />
         
        </div>
        
        {panels.map((panel) => {
          return (
            <button
              key={panel.key}
              className={`sidebar-icon ${activePanel === panel.key ? " active" : ""} `}
              onClick={() => handlePanelContent(panel)}
              title={panel.label}
            >
              {panel.icon}
            </button>
          );
        })}
      </div>

      <div
        className="sidebar-panel"
        ref={sidebarRef}
        style={{
          width: activePanel ? width : 0,
          minWidth: 0,
          border: activePanel ? "" : "none",
          background: activePanel ? "" : "transparent",
        }}
      >
        {activePanel && (
          <>
            <div className="sidebar-panel-content">
              {renderActivePanelContent()}
            </div>
            <div className="sidebar-resizer" onMouseDown={startResize} />
          </>
        )}
      </div>

    </div>
  );
}
