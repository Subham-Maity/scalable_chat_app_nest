'use client';

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3002');

const ChatComponent = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });
    socket.on('user-joined', (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
    socket.on('user-left', (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
    return () => {
      socket.off('message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('newMessage', message);
      setMessage('');
    }
  };

  return (
    <div className="align">
        <div className="heading">
          Chat
        </div>
        <div className="msg">
          {messages.map((msg, index) => (
            <div key={index} className="msg-li">
              {msg}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="input"
          />
          <button
            type="submit"
            className="btn"
          >
            Send
          </button>
        </form>
    </div>
  );
};

export default ChatComponent;