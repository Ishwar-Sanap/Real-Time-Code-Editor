import React, { useState } from "react";
import "./CodeRunner.css";
import { useCode } from "../../contexts/CodeContext";
import { useEffect } from "react";
import { useRef } from "react";
import { useSelector } from "react-redux";

const getFileName = (language) => {
  switch (language.toLowerCase()) {
    case "python":
    case "python3":
      return "main.py";
    case "cpp":
      return "main.cpp";
    case "c":
      return "main.c";
    case "java":
      return "Main.java";
    case "javascript":
      return "main.js";
    default:
      return "main.txt";
  }
};

let codeRunSuccess = true;
const runCode = async (code, codeInputs, language) => {
  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        version: "*", // use latest available version..
        stdin:codeInputs,
        files: [
          {
            name: getFileName(language),
            content: code,
          },
        ],
      }),
    });

    const result = await response.json();
    return {stdErr: result.run.stderr, codeOutPut : result.run.output};
  } catch (err) {
    return {stdErr: err.message , codeOutPut : err.message};
  }
};

function showPopUpTooltip(message) {
  const tooltip = document.createElement("div");
  tooltip.innerText = message;

  // Inline CSS
  Object.assign(tooltip.style, {
    position: "fixed",
    top: "30px",
    right: "30px",
    background: "rgba(242, 24, 24, 0.9)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    zIndex: "9999",
    opacity: "0",
    transition: "opacity 0.3s ease",
  });

  document.body.appendChild(tooltip);

  // Fade in
  requestAnimationFrame(() => {
    tooltip.style.opacity = "1";
  });

  // Fade out + remove
  setTimeout(() => {
    tooltip.style.opacity = "0";
    setTimeout(() => tooltip.remove(), 300); // wait for fade-out
  }, 2000);
}

export default function CodeRunner() {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [codeRunResult , setCodeRunResult]= useState(true);
  const [codeInputs, setCodeInputs] = useState("");
  const language = useSelector((state) => state.editorSettings.language);
  const { code } = useCode();
  const users = useSelector((state)=> state.connectedClients.clients);
  const myUserName = sessionStorage.getItem("userName");

  const handleRunCode = async () => {
    const me = users.find((u) => u.userName === myUserName);
    if (me && me.permission && !me.permission.execute) {
      showPopUpTooltip("🚫 You don't have permission to run the code");
      return;
    }

    setIsRunning(true);
    setOutput("Running...");
    setCodeRunResult(true);
    // Your API call here
    const {stdErr, codeOutPut } = await runCode(code,codeInputs,language);

    setTimeout(() => {
  
      if (stdErr) setCodeRunResult(false);

      setOutput(codeOutPut);
      setIsRunning(false);
    }, 1000);
  };

  return (
    <div className="coderunner-container">
      <h3 className="panel-heading">Code Runner</h3>

      <div className="input-box">
        <h4>Enter Inputs</h4>
        <textarea
          className="code-input"
          value={codeInputs}
          onChange={(e) => setCodeInputs(e.target.value)}
          placeholder="Enter your code inputs here..."
        />
      </div>

      <div className="code-action-btns">
        <button className="btn clear-btn" onClick={() => setCodeInputs("")}>
          Clear Input
        </button>

        <button
          className="btn run-btn"
          onClick={handleRunCode}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="output-box">
        <h4>Code Output</h4>
        <div className={`code-output ${codeRunResult === true ? " success" : " failure"}`}>{output}</div>
        <button className="btn clear-btn" onClick={() => setOutput("")}>
          Clear Output
        </button>
      </div>
    </div>
  );
}
