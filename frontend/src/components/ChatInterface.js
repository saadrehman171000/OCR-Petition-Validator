import React, { useState } from "react";
import "./ChatInterface.css";

const ChatInterface = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "bot", text: "Response from the bot" },
    ]);
  };

  return (
    <div className="chat-interface">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="message-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;
