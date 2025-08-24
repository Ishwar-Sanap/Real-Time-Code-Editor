import React, { useState, useRef, useEffect } from "react";
import "./Chat.css"
import ACTIONS from "../../actions";
import { useLocation, useParams } from "react-router-dom";

export default function Chat({socketRef}) {

  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
   { text: "Hello", sender: "You", time: new Date()},
   { text: "Hi, how can i help you today?", sender: "Alexa", time: new Date()},
   { text: "All good?", sender: "You", time: new Date()},
   { text: "Yes I am perfectly fine.. what about you??", sender: "Alexa", time: new Date()},
   { text: "Hey, I am building the real time code editor, with features like Code run, chats suggest me some unique interesting names for project", sender: "You", time: new Date()},
   { text: "Nice 🚀 That's an exciting project! Since your editor has real-time collaboration + code execution + chat, ll suggest some unique, catchy names that reflect coding + teamwork + communication", sender: "Alexa", time: new Date()},
  ]);
  const [message, setMessage] = useState("");
  const location = useLocation()
  const userName =  location.state?.userName;
  // console.log("user of chat panel : ", userName)

  const { roomID } = useParams()

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 const sendMessage = () => {
    if (message.trim() === "") return;
  
    const newMsg = {roomID ,text: message, sender: userName, time: new Date() };

    // When yourser clicks on sendMessage that, mens the sender is himself so while disply message on UI
    // User should dislpay as you : and other clients should be able to display the name
    const yourMsg = {...newMsg, sender : "You"};

    setMessages((prev)=> [...prev , yourMsg]);
    setMessage("");

    //Sending the chat messages to the server..
    socketRef.current.emit(ACTIONS.CHAT_MSG, newMsg);
  };

  useEffect(()=>{
    console.log('Reciving messages from server: ')
     //Listen the message send from server
    socketRef.current.on(ACTIONS.CHAT_MSG, ({text, sender, time})=>{

      const newMsg = {text, sender , time};
      console.log(newMsg)

      setMessages((prev) => [...prev, newMsg]);
    })

    //clean up
    return ()=>{
        socketRef.current.off(ACTIONS.CHAT_MSG);
    }
  },[socketRef.current])

 return (
    <div className="chat-container">
       <h3 className="panel-heading">Group Chats</h3>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${
              msg.sender === "You" ? "chat-message-you" : "chat-message-other"
            }`}
          >
            {msg.text}
            <span>
              {msg.sender} • {new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
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
        <button  onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}