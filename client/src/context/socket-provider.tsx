"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

interface SocketContextValue {
  sendMessage: (msg: string) => void;
  messages: string[];
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const sendMessage = useCallback(
    (msg: string) => {
      if (socket) {
        socket.emit("newMessage", msg);
      }
    },
    [socket],
  );

  useEffect(() => {
    const newSocket = io("http://localhost:3002");
    setSocket(newSocket);

    newSocket.on("message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    newSocket.on("user-joined", (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    newSocket.on("user-left", (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    return () => {
      newSocket.off("message");
      newSocket.off("user-joined");
      newSocket.off("user-left");
      newSocket.disconnect();
    };
  }, []);

  const contextValue: SocketContextValue = {
    sendMessage,
    messages,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
