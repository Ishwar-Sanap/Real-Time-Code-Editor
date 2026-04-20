import React, { useState, useRef, useEffect } from "react";
import Clients from "../Clients";
import "./SideBar.css";
import Chat from "../chats/Chat";
import { FaPlay } from "react-icons/fa";
import { FaFileDownload } from "react-icons/fa";
import { BsChatSquareTextFill } from "react-icons/bs";
import { FaUsers } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";
import Settings from "../settings/Settings";
import CodeRunner from "../coderunner/CodeRunner";
import logo from "../../assets/logo.png";
import { useSelector } from "react-redux";
import { useCode } from "../../contexts/CodeContext";

const panels = [
  { key: "run", icon: <FaPlay size={"25px"} />, label: "Run" },
  {
    key: "chats",
    icon: <BsChatSquareTextFill size={"25px"} />,
    label: "Chats",
  },
  { key: "clients", icon: <FaUsers size={"25px"} />, label: "Clients" },
  {
    key: "settings",
    icon: <IoSettingsSharp size={"25px"} />,
    label: "Settings",
  },
  {
    key: "download",
    icon: <FaFileDownload size={"25px"} />,
    label: "Download File",
  },
];

const getFileName = (language) => {
  switch (language.toLowerCase()) {
    case "python":
    case "python3":
      return "test.py";
    case "cpp":
      return "test.cpp";
    case "c":
      return "test.c";
    case "java":
      return "Test.java";
    case "javascript":
      return "test.js";
    default:
      return "test.txt";
  }
};

function downloadCodeFile(content, fileName, language) {
  const mimeTypes = {
    javascript: "application/javascript",
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    json: "application/json",
    txt: "text/plain",
    python3: "text/x-python",
    java: "text/x-java-source",
  };

  const mimeType = mimeTypes[language] || "text/plain";

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState();
  const [width, setWidth] = useState(350);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  const language = useSelector((state) => state.editorSettings.language);
  const { code } = useCode();

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
    if (panel === "CodeEditor" || activePanel === panel.key) {
      setActivePanel(null);
    }
    // else set the clicked panel as active
    else setActivePanel(panel.key);
  };
  const renderActivePanelContent = () => {
    if (activePanel == "clients") {
      return <Clients />;
    } else if (activePanel == "chats") {
      return <Chat />;
    } else if (activePanel == "settings") {
      return <Settings />;
    } else if (activePanel == "run") {
      return <CodeRunner />;
    } else if (activePanel == "download") {
      setActivePanel(null);
      const fileName = getFileName(language);
      downloadCodeFile(code, fileName);
      return null;
    }
  };

  const handleResize = (e) => {
    if (isResizing.current) {
      setWidth(
        Math.max(
          150,
          e.clientX - sidebarRef.current.getBoundingClientRect().left,
        ),
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
          <img
            src={logo}
            alt="Logo"
            className="sidebar-logo-img"
            onClick={() => handlePanelContent("CodeEditor")}
          />
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
        className={`sidebar-panel ${activePanel ? " panel-active" : " "}`}
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
