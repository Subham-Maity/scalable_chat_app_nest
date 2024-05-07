"use client";
import React, { useEffect, useRef } from "react";
import { useSocket } from "@/context/socket-provider";
import ChatInput from "@/components/chat-input";

const ChatComponent = () => {
  const { messages } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="align">
      <div className="heading">Chat</div>
      <div className="msg">
        {messages.map((msg, index) => (
          <div key={index} className="msg-li">
            {msg}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput />
    </div>
  );
};

export default ChatComponent;
