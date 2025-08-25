import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import ACTIONS from "../actions";
import { useSocket } from "../contexts/SocketContext";

export default function Editor({ roomID, onCodeChange }) {
  const textAreaRef = useRef(null);
  const codeMirrInstance = useRef(null);
  const socketRef = useSocket();
  
  useEffect(() => {
    async function init() {
      if (textAreaRef.current && !codeMirrInstance.current) {
        codeMirrInstance.current = Codemirror.fromTextArea(
          textAreaRef.current,
          {
            mode: { name: "javascript", json: true },
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
          }
        );
      }

      //
      codeMirrInstance.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        console.log(code);
        onCodeChange(code); // Call the onCodeChange prop to update the code in the parent component
        if (origin !== "setValue") {
          console.log("Code change event emmited");
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomID,
            code,
          });
        }
      });

      codeMirrInstance.current.setValue("// Your code goes here..");
    }

    init();

    //clean up the editor instance on unmount
    return () => {
      if (codeMirrInstance.current) {
        codeMirrInstance.current.toTextArea();
        codeMirrInstance.current = null;
      }
    };
  }, []);

  // Listen for the CODE_CHANGE event to update the editor with the code from other clients
  // This will be called when the server emits the CODE_CHANGE event
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          codeMirrInstance.current.setValue(code);
        }
      });
    }

    // Clean up the event listener on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };

  }, [socketRef.current]); // when socketRef changes, this effect will run again

  return (
    <>
      <textarea ref={textAreaRef} name="" id="real-time-editor"></textarea>
    </>
  );
}
