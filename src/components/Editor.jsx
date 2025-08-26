import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import ACTIONS from "../actions";
import { useSocket } from "../contexts/SocketContext";
import throttle from "lodash.throttle";

export default function Editor({ roomID, onCodeChange }) {
  const textAreaRef = useRef(null);
  const codeMirrInstance = useRef(null);
  const socketRef = useSocket();

  const myUserName = sessionStorage.getItem("userName");
  console.log("userName in editor ", myUserName);

  const cursors = {};

  function updateCursorTooltip(editor, userName, cursor, color = "red") {
    // invalid cursor
    if (!cursor || cursor.line == null || cursor.ch == null) {
      return;
    }
    if (cursor.line === 0 && cursor.ch === 0) return;

    // clear old marker
    if (cursors[userName]?.marker) cursors[userName].marker.clear();
    if (cursors[userName]?.timeoutId) clearTimeout(cursors[userName].timeoutId);

    // container
    const cursorContainer = document.createElement("span");
    cursorContainer.style.position = "relative";

    // caret
    const caret = document.createElement("span");
    caret.style.borderLeft = `2px solid ${color}`;
    caret.style.height = `${editor.defaultTextHeight()}px`;
    caret.style.display = "inline-block";
    caret.style.verticalAlign = "text-top";

    // tooltip
    const tooltip = document.createElement("div");
    tooltip.textContent = userName;
    tooltip.style.position = "absolute";
    tooltip.style.top = `-${editor.defaultTextHeight()}px`;
    tooltip.style.left = "0";
    tooltip.style.background = color;
    tooltip.style.color = "white";
    tooltip.style.fontSize = "10px";
    tooltip.style.padding = "2px 4px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.transition = "opacity 0.5s ease";
    tooltip.style.opacity = "1";

    cursorContainer.appendChild(caret);
    cursorContainer.appendChild(tooltip);

    // add marker
    const marker = editor.setBookmark(
      { line: cursor.line, ch: cursor.ch },
      {
        widget: cursorContainer,
        insertLeft: true,
      }
    );

    // store marker + timeout
    cursors[userName] = { marker, timeoutId: null };

    // set timeout to fade tooltip after 3s
    cursors[userName].timeoutId = setTimeout(() => {
      tooltip.style.opacity = "0"; // fade out
      caret.style.opacity = "0";
    }, 3000);
  }

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

      codeMirrInstance.current.on(
        "cursorActivity",
        
        // Creates a throttled function that only invokes func at most once per every wait milliseconds.
        throttle((cm) => {
          const cursor = cm.getCursor();
          console.log("Cursor Pos : ", cursor);
          socketRef.current.emit(ACTIONS.CURSOR_POS_SYNC, {
            userName: myUserName,
            roomID,
            cursor,
          });

          // update my own tooltip immediately
          updateCursorTooltip(
            codeMirrInstance.current,
            myUserName,
            cursor,
            "blue"
          );
        }, 100)

      );
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
    if (!socketRef.current) return;

    socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
      if (code !== null) {
        codeMirrInstance.current.setValue(code);
      }
    });

    socketRef.current.on(ACTIONS.CURSOR_POS_SYNC, ({ userName, cursor }) => {
      console.log("Listening ACTIONS.CURSOR_POS_SYNC ", userName);
      if (userName == myUserName) return;

      updateCursorTooltip(codeMirrInstance.current, userName, cursor, "red");
    });

    // Clean up the event listener on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.CURSOR_POS_SYNC);
      }
    };
  }, [socketRef.current]); // when socketRef changes, this effect will run again

  return (
    <>
      <textarea ref={textAreaRef} name="" id="real-time-editor"></textarea>
    </>
  );
}
