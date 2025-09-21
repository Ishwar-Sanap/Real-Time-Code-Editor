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
  const [usersTyping, setUsersTyping] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current) return;
    

    //Listen for new chat messages
    socketRef.current.on(ACTIONS.CHAT_MSG, ({ text, sender, time }) => {
      const newMsg = { text, sender, time };
      setMessages((prev) => [...prev, newMsg]);
    });

    //Listening for chat synch
    socketRef.current.on(ACTIONS.CHAT_MSG_SYNC, ({ messages }) => {
      setMessages(messages);
    });

    //listening for user type
    socketRef.current.on(ACTIONS.USER_TYPING, ({userName})=>{
      setUsersTyping((prev)=> prev.includes(userName) ? prev : [...prev, userName]);
    })

    //Listening for user stop type
    socketRef.current.on(ACTIONS.USER_STOP_TYPING, ({userName})=>{
      setUsersTyping((prev)=> prev.filter((user)=> user != userName));
    })
    //After listeners are attached, request chat synch
    socketRef.current.emit(ACTIONS.SYNC_CHATS, {roomID ,socketID: socketRef.current.id});

    //clean up
    return () => {
      if (!socketRef.current) return;
      
      socketRef.current.off(ACTIONS.CHAT_MSG);
      socketRef.current.off(ACTIONS.CHAT_MSG_SYNC);
      socketRef.current.off(ACTIONS.USER_TYPING);
      socketRef.current.off(ACTIONS.USER_STOP_TYPING);
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

  const handleMessageType = (e)=>{
    setMessage(e.target.value)
    // console.log(userName, "is typing..");

    socketRef.current.emit(ACTIONS.USER_TYPING, {roomID,userName})

    if(typingTimeoutRef.current){
      clearTimeout(typingTimeoutRef.current);
    }

    //If user have not type 2Sec, then stop user typing
    typingTimeoutRef.current = setTimeout(()=>{
      socketRef.current.emit(ACTIONS.USER_STOP_TYPING, {roomID, userName});
    },2000)

  }

  return (
    <div className="chat-container">
      <h3 className="panel-heading">Group Chats</h3>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${
              msg.sender === userName
                ? "chat-message-you"
                : "chat-message-other"
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

      {/* users typing indicator */}
      {usersTyping.length > 0 && (
        <div className="typing-indicator">
          {usersTyping.join(", ")} {usersTyping.length === 1 ? "is" : "are"}{" "}
          typing...
        </div>
      )}

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleMessageType}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
