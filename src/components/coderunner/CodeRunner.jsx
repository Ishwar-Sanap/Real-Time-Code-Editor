import React, { useState } from "react";
import "./CodeRunner.css";
import { useCode } from "../../contexts/CodeContext";
import { useEffect } from "react";
import { useRef } from "react";

const runCode = async (code) => {
  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: "python3",
        version: "3.10.0",
        files: [
          {
            name: "main.py",
            content: code,
          },
        ],
      }),
    });

    const result = await response.json();
    // console.log(result.run.output);
    return result.run.output;
  } catch (err) {
    // console.log("Error: " + err.message);
    return err.message;
  }
};

export default function CodeRunner() {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [codeInputs, setCodeInputs] = useState("");

  const { code } = useCode();

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Running...");

    // Your API call here
    const codeOutput = runCode(code);

    setTimeout(() => {
      setOutput(codeOutput);
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
        <div className="code-output">{output}</div>
        <button className="btn clear-btn" onClick={() => setOutput("")}>
          Clear Output
        </button>
      </div>
    </div>
  );
}
