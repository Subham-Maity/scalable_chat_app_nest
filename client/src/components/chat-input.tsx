import React from "react";
import { useSocket } from "@/context/socket-provider";

const ChatInput = () => {
  const [message, setMessage] = React.useState("");
  const { sendMessage } = useSocket();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="input"
      />
      <button type="submit" className="btn">
        Send
      </button>
    </form>
  );
};

export default ChatInput;
