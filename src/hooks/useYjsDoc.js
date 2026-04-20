import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { useSocket } from "../contexts/SocketContext";
import { initSocket } from "../socket";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ACTIONS from "../actions";
import { removeClient, setClient, updatePermission } from "../redux/slices/clientsSlice";
import { useDispatch } from "react-redux";

/**
 * Custom Yjs hook that syncs over Socket.IO, Handles doc sync, awareness (cursors), and connection status
 */
export function useYjsDoc(roomID, setLoading) {
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const awarenessRef = useRef(null);
  const [status, setStatus] = useState("connecting");
  const reactNavigator = useNavigate(); // useNavigate is used to navigate to different routes
  const dispatch = useDispatch();

  const myUserName = sessionStorage.getItem("userName");
  const myUserDetails = JSON.parse(sessionStorage.getItem("user"));
  const hostUserID = sessionStorage.getItem("hostUser");

  const myColor = useRef(getRandomColor()).current;

  const handleErrors = (err) => {
    toast.error("Socket connection failed, try again later!");
    socketRef.current.disconnect();
    socketRef.current = null;
    setLoading(false);
    reactNavigator("/");
  };

  useEffect(() => {
    if (!roomID) return;

    const init = async () => {
      try {
        const socket = await initSocket();
        socketRef.current = socket;
        socketRef.current.on("connect_error", (err) => handleErrors(err));
        socketRef.current.on("connect_failed", (err) => handleErrors(err));

        const ydoc = new Y.Doc();
        const yText = ydoc.getText("codemirror");
        const awareness = new Awareness(ydoc);

        awareness.setLocalStateField("user", {
          name: myUserName,
          color: myColor,
        });

        ydocRef.current = ydoc;
        awarenessRef.current = awareness;

        // ── Connection events ──
        socket.on("connect", () => {
          setStatus("connected");
          socket.emit("yjs:join", {
            roomID,
            userDetails: {
              ...myUserDetails,
              userRole: hostUserID === myUserDetails.userID ? "host" : "guest",
            },
          }); // when new client connected emit join event to server
        });

        socket.on("disconnect", () => setStatus("disconnected"));

        // ── Yjs sync protocol ──
        socket.on("yjs:sync", (update) => {
          Y.applyUpdate(ydoc, new Uint8Array(update)); // sync & applying the doc changes
        });

        socket.on("yjs:update", (update) => {
          Y.applyUpdate(ydoc, new Uint8Array(update)); // apply the new doc updates
        });

        // Broadcast our updates
        ydoc.on("update", (update, origin) => {
          if (origin !== socket.id) {
            socket.emit("yjs:update", { roomID, update: Array.from(update) }); // Emit the doc update to server
          }
        });

        socket.on("yjs:awareness", (encodedUpdate) => {
          applyAwarenessUpdate(
            awareness,
            new Uint8Array(encodedUpdate),
            socket.id,
          );
        });

        awareness.on("change", ({ added, updated, removed }) => {
          const changedClients = [...added, ...updated, ...removed];
          const update = encodeAwarenessUpdate(awareness, changedClients);
          socket.emit("yjs:awareness", { roomID, update: Array.from(update) });
        });

        socket.on(ACTIONS.JOINED, ({ clients, socketID, userDetails }) => {
          dispatch(setClient(clients));
          if (userDetails.userID !== myUserDetails.userID)
            toast.success(`${userDetails.userName} has joined the room`);
        });

        socketRef.current.on(
          ACTIONS.DATA_PERMISSIONS,
          ({ socketID, newPermission }) => {
            dispatch(updatePermission({ socketID, newPermission }));
          },
        );

        socket.on(ACTIONS.DISCONNECTED, ({ socketID, userName }) => {
          dispatch(removeClient(socketID));
          toast.error(`${userName} has left the room`);
        });
      } catch (error) {
        handleErrors(error);
      }
    };

    init();
    // ── Cleanup ──
    return () => {
      if (ydocRef.current) {
        ydocRef.current.off("update");
        ydocRef.current.destroy();
      }
      if (awarenessRef.current) {
        awarenessRef.current.off("change");
        awarenessRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
        socketRef.current.off("yjs:sync");
        socketRef.current.off("yjs:update");
        socketRef.current.off("yjs:awareness");
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DATA_PERMISSIONS);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [roomID]);

  return {
    yText: ydocRef.current?.getText("codemirror"),
    ydoc: ydocRef.current,
    awareness: awarenessRef.current,
    status,
    socketRef,
    status,
  };
}

function getRandomColor() {
  const colors = [
    "#5eead4",
    "#f472b6",
    "#7dd3fc",
    "#fbbf24",
    "#a78bfa",
    "#fb923c",
    "#86efac",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
