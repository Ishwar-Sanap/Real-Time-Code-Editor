import { useState, useRef, useEffect } from "react";
import "./Chat.css";
import ACTIONS from "../../actions";
import { useLocation, useParams } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useMessages } from "../../contexts/MessagesContext";

export default function Chat() {
  const messagesEndRef = useRef(null);
  const { messages, setMessages } = useMessages();
  const [message, setMessage] = useState("");
  const location = useLocation();
  const userName = location.state?.userName;
  const { roomID } = useParams();
  const socketRef = useSocket();

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current) return;
    
    console.log("Reciving messages from server : ");

    //Listen for new chat messages
    socketRef.current.on(ACTIONS.CHAT_MSG, ({ text, sender, time }) => {
      const newMsg = { text, sender, time };
      console.log(newMsg);
      setMessages((prev) => [...prev, newMsg]);
    });

    //Listening for chat synch
    socketRef.current.on(ACTIONS.CHAT_MSG_SYNC, ({ messages }) => {
      setMessages(messages);
    });

    //After listeners are attached, request chat synch
    socketRef.current.emit(ACTIONS.SYNC_CHATS, {roomID ,socketID: socketRef.current.id});

    //clean up
    return () => {
      if (!socketRef.current) return;
      
      socketRef.current.off(ACTIONS.CHAT_MSG);
      socketRef.current.off(ACTIONS.CHAT_MSG_SYNC);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const newMsg = {
      roomID,
      text: message,
      sender: userName,
      time: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    //Sending the chat messages to the server..
    socketRef.current.emit(ACTIONS.CHAT_MSG, newMsg);
  };

  return (
    <div className="chat-container">
      <h3 className="panel-heading">Group Chats</h3>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${
              msg.sender === userName ? "chat-message-you" : "chat-message-other"
            }`}
          >
            {msg.text}
            <span>
              {msg.sender === userName ? "You" : msg.sender} •{" "}
              {new Date(msg.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef}></div>
        
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
