import React, { useState, useRef, useEffect } from "react";
import Clients from "../Clients";
import "./SideBar.css";
import Chat from "../chats/Chat";

const panels = [
  { key: "files", icon: "📁", label: "Files" },
  { key: "run", icon: "▶", label: "run" },
  { key: "chats", icon: "🗪", label: "chats" },
  { key: "search", icon: "🔍", label: "Search" },
  { key: "clients", icon: "👥", label: "clients" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

const panelContent = {
  files: <div>File Explorer Content</div>,
  search: <div>Search Content</div>,
  settings: <div>Settings Content</div>,
};

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState();
  const [width, setWidth] = useState(350);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  const startResize = (e) => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
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
          <img src="/" alt="Logo" className="logo-img" />
        </div>
        
        {panels.map((panel) => {
          return (
            <button
              key={panel.key}
              className={`sidebar-icon ${
                activePanel === panel.key ? " active" : ""
              }`}
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
