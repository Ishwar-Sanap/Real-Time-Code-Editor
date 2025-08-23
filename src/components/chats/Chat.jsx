import React, { useState, useRef, useEffect } from "react";

export default function Chat({ userName = "You" }) {
  const [messages, setMessages] = useState([
    {user:"amit" , text: "Hello"},
    {user: "catherin", text : "Hii"}
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    setMessages([...messages, { user: userName, text: input }]);
    setInput("");
  };

  return (
    <div className="chats-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h3 className="panel-heading">Group Chats</h3>
      <div className="messages-list" style={{ flex: 1, overflowY: "auto", marginBottom: "10px", padding: "8px" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: "4px 0" , width: "50%", marginLeft : "auto" }}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "8px 16px", borderRadius: "4px", background: "#646cff", color: "#fff", border: "none" }}>
          Send
        </button>
      </form>
    </div>
  );
}