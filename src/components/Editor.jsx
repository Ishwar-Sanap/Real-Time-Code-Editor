import React, { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/clike/clike";
import "codemirror/mode/python/python";
import "codemirror/theme/dracula.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/base16-light.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/midnight.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";

import ACTIONS from "../actions";
import { useSocket } from "../contexts/SocketContext";
import throttle from "lodash.throttle";
import { useDispatch, useSelector } from "react-redux";
import { useCode } from "../contexts/CodeContext";
import { updatePermission } from "../redux/slices/clientsSlice";

function getRandomColor() {
  //Hexadecimal color format : #FFFFFF

  const letteres = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    let indx = Math.floor(Math.random() * 16);
    color += letteres[indx];
  }

  return color;
}

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

export default function Editor({ roomID }) {
  const textAreaRef = useRef(null);
  const codeMirrInstance = useRef(null);
  const socketRef = useSocket();
  const language = useSelector((state) => state.editorSettings.language);
  const theme = useSelector((state) => state.editorSettings.theme);
  const fontSize = useSelector((state) => state.editorSettings.fontSize);
  const cursorToolTip = useSelector((state) => state.editorSettings.toolTip)
  const users = useSelector((state)=> state.connectedClients.clients);
  const dispatch = useDispatch();
  const myUserName = sessionStorage.getItem("userName");
  const hostUser = sessionStorage.getItem("hostUser") ;
  const cursors = useRef({});
  const cursorToolTipRef = useRef(cursorToolTip);
  const {codeRef,code, setCode} = useCode();

  function updateCursorTooltip(editor, userName, cursor, color) {
    if(!cursorToolTipRef.current && userName == myUserName)return;

    // invalid cursor
    if (!cursor || cursor.line == null || cursor.ch == null) return;
    if (cursor.line === 0 && cursor.ch === 0) return;

    // clear old marker
    if (cursors.current[userName]?.marker) cursors.current[userName].marker.clear();
    if (cursors.current[userName]?.timeoutId) clearTimeout(cursors.current[userName].timeoutId);

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

    if (cursor.line > 0) tooltip.style.top = `-${editor.defaultTextHeight()}px`;

    tooltip.style.left = "0";
    tooltip.style.background = color;
    tooltip.style.color = "white";
    tooltip.style.fontSize = "13px";
    tooltip.style.padding = "2px 4px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.transition = "opacity 0.5s ease";
    tooltip.style.opacity = "1";

    // cursorContainer.appendChild(caret);
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
    cursors.current[userName] = { marker, timeoutId: null };

    // set timeout to fade tooltip after 3s
    cursors.current[userName].timeoutId = setTimeout(() => {
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
            mode: language,
            theme,
            lineNumbers: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
          }
        );
      }

      codeMirrInstance.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const currCode = instance.getValue();

        //onCodeChange(code); // Call the onCodeChange prop to update the code in the parent component
        codeRef.current = currCode;
        setCode(currCode);

        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomID,
            code: currCode,
          });
        }
      });

      codeMirrInstance.current.setValue("// Your code goes here..");
      const randomColor = getRandomColor();

      codeMirrInstance.current.on(
        "cursorActivity",

        // Creates a throttled function that only invokes func at most once per every wait milliseconds.
        throttle((cm) => {
          const cursor = cm.getCursor(); // it will give the cursor position from editor (line num, character position)
          socketRef.current.emit(ACTIONS.CURSOR_POS_SYNC, {
            userName: myUserName,
            roomID,
            cursor,
            randomColor,
          });

          // update my own tooltip immediately
          updateCursorTooltip(
            codeMirrInstance.current,
            myUserName,
            cursor,
            randomColor
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

    socketRef.current.on(
      ACTIONS.CURSOR_POS_SYNC,
      ({ userName, cursor, randomColor }) => {
        if (userName == myUserName) return;
        updateCursorTooltip(
          codeMirrInstance.current,
          userName,
          cursor,
          randomColor
        );
      }
    );

    socketRef.current.on(ACTIONS.DATA_PERMISSIONS, ({socketID, newPermission})=>{
       dispatch(updatePermission({socketID , newPermission}));
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.CURSOR_POS_SYNC);
        socketRef.current.off(ACTIONS.DATA_PERMISSIONS);
      }
    };
  }, [socketRef.current]); // when socketRef changes, this effect will run again

  useEffect(() => {
    if (codeMirrInstance.current) {
      let mode = language;
      if (language === "c") mode = "text/x-csrc";
      else if (language === "cpp") mode = "text/x-c++src";
      else if (language === "java") mode = "text/x-java";
      else if (language === "javascript") mode = "javascript";
      else if (language === "python3") mode = "python";

      codeMirrInstance.current.setOption("mode", mode);
    }
  }, [language]);

  useEffect(() => {
    if (codeMirrInstance.current) {
      codeMirrInstance.current.setOption("theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (codeMirrInstance.current) {
      codeMirrInstance.current.getWrapperElement().style.fontSize = fontSize;
    }
  }, [fontSize]);

useEffect(() => {
  if (!codeMirrInstance.current) return;

  function handleKeyDown(cm, e) {
    const me = users.find((u) => u.userName === myUserName);

    if (me && me.permission && !me.permission.write) {
      showPopUpTooltip("🚫 You don't have permission to write the code");
      e.preventDefault();
    }
  }
  codeMirrInstance.current.on("keydown", handleKeyDown);

  return () => {
    if (codeMirrInstance.current) {
      codeMirrInstance.current.off("keydown", handleKeyDown);
    }
  };
}, [users]);

useEffect(() => {
  if (!codeMirrInstance.current) return;
  cursorToolTipRef.current = cursorToolTip;

  if (!cursorToolTip) {
    // Remove all tooltip markers
    Object.values(cursors.current).forEach(({ marker, timeoutId }) => {
      if (marker) marker.clear();
      if (timeoutId) clearTimeout(timeoutId);
    });

    cursors.current = {}
  }

}, [cursorToolTip]);
  return (
    <>
      <textarea ref={textAreaRef} name="" id="real-time-editor"></textarea>
    </>
  );
}
