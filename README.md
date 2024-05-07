# Step 1 : Basic Setup (Communication Server-Client)
### [**Code**](https://github.com/Subham-Maity/scalable_chat_app_nest/tree/5adeea135b5010e44b30ea36bdc156ee929ed893)
- `server` - `api/src/chat/chat.gateway.ts`
```ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * @WebSocketGateway is a decorator that creates a WebSocket gateway
 * and exposes a specified port (3002) for the WebSocket server.
 * The `cors` option allows cross-origin requests.
 */
@WebSocketGateway(3002,{cors:true})
/*
✅//OnGatewayConnection
 io.on("connection", (socket) => {
    console.log("Client connected");
✅ //OnGatewayDisconnect
 socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
*//**
 * This class implements the OnGatewayConnection and OnGatewayDisconnect interfaces,
 * which provide methods to handle client connections and disconnections.
 *
 * The commented-out code demonstrates how to handle connections and disconnections
 * using the socket.io event listeners `io.on("connection", ...)` and `socket.on("disconnect", ...)`.
 */

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
  private readonly logger = new Logger(ChatGateway.name);
  /**
   * @WebSocketServer() is a decorator that injects the Socket.IO server instance.
   * It allows you to access and interact with the WebSocket server.
   */
  @WebSocketServer() server: Server

  /**
   * This method is called when a new client connects to the WebSocket server.
   * It logs the client's connection, and emits a `user-joined` event to all connected clients,
   * including the client's ID in the event payload.
   */
  handleConnection(client: Socket){
    this.logger.verbose('New client connected', client.id);

    //The event data will only be broadcast to every socket but the sender.
    //instead of this.server.emit we use client.broadcast.emit because we don't need to show the same user that he join the chat again
    //so broadcast the message to all clients except the user who just joined
    client.broadcast.emit( `user-joined`, {
      message: `New user joined the chat: ${client.id}`,
      id: client.id
    })
  }

  /**
   * This method is called when a client disconnects from the WebSocket server.
   * It logs the client's disconnection, and emits a `user-left` event to all connected clients,
   * including the client's ID in the event payload.
   */
  handleDisconnect(client: Socket){
    this.logger.verbose('Client disconnected', client.id);
    this.server.emit( `user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id
    })
  }
  /**
   * This method is called when a client sends a message with the event name 'newMessage'.
   * It receives the client socket instance and the message payload.
   *
   * The method logs the received message, broadcasts the message to all connected clients
   * using the 'message' event, and sends a reply to the current client with the "Hello from server" message.
   *
   * It also demonstrates how to broadcast a message to all clients using `this.server.emit("reply", "broadcasting...")`.
   */
  @SubscribeMessage('newMessage')
  handleNewMessage( client: Socket,@MessageBody() message: any) {

    // Log the received message
    this.logger.debug(message);

    // Broadcast the received message to all clients (group chat)
    this.server.emit('message', message); //broadcast to all clients (group chat)
    /**
     //socket.emit("reply", "Hello from server") - Reply to the current client with a "Hello from server" message
     if (client) {
     client.emit("reply", "Hello from server")
     } else {
     console.log('Client is undefined');
     }

     // io.emit("reply", "broadcasting...") - broadcast to all clients
     //reply - event , broadcasting... - arguments
     this.server.emit("reply", "broadcasting...")
     */
  }
}

```

- `Client` - `client/src/components/chat.tsx`
```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3002');

const ChatComponent = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // fn: this.server.emit('message', message)
    // This event listener is triggered when the server broadcasts a message to all clients using 'this.server.emit('message', message)'
    // It receives the broadcast message and appends it to the 'messages' state
    socket.on('message', (data) => {
      //If we directly push the new data into the messages array using the push method (e.g., messages.push(data)),
      // we would be mutating the existing state array.
      // Reacts state updates are designed to be immutable, so mutating the state directly can lead to unexpected behavior and potential bugs.
      //By using the spread operator ...prevMessages, we create a new array that includes all the elements from the previous messages array (prevMessages).
      // This way, we don't lose any existing messages when adding a new
      //...prevMessages is the spread syntax, which spreads the elements of the prevMessages array into a new array.
      //[...prevMessages, data] creates a new array by combining the elements from prevMessages and the new data element.
      // The resulting array [...prevMessages, data] becomes the new value of the messages state.
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // fn: this.server.emit('user-joined', { message: `New user joined the chat: ${client.id}`, id: client.id })
    // This event listener is triggered when the server emits a 'user-joined' event with a message and client ID
    // It receives the event payload and appends the message to the 'messages' state
    socket.on('user-joined', (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    // fn: this.server.emit('user-left', { message: `User left the chat: ${client.id}`, id: client.id })
    // This event listener is triggered when the server emits a 'user-left' event with a message and client ID
    // It receives the event payload and appends the message to the 'messages' state
    socket.on('user-left', (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
    // This is a cleanup function that runs when the component is unmounted or when the effect is re-run due to a change in dependencies.
    // It removes the event listeners for 'message', 'user-joined', and 'user-left' events to prevent memory leaks.
    return () => {
      socket.off('message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, []);
  // This useEffect hook is responsible for scrolling the message container to the bottom whenever the 'messages' state changes.
  // It ensures that the latest messages are always visible without the user having to manually scroll down.
  useEffect(() => {
    // messagesEndRef.current is a reference to the div element at the end of the message container.
    // The '?' is a safe navigation operator to ensure that messagesEndRef.current is not null or undefined before calling scrollIntoView().
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // fn: @SubscribeMessage('newMessage')
  // This function is triggered when the user submits a message
  // It emits the 'newMessage' event with the message content to the server
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
```


# Step 2 : Setup Context with Component
### [**Code**]()

Destructure the code 


`Context` - `client/src/context/socket-provider.tsx`

```tsx
"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

// Interface defining the shape of the SocketContext value
// This interface specifies the structure of the data that will be provided by the SocketContext
interface SocketContextValue {
  // sendMessage is a function that takes a string argument and is used to send a message to the server
  sendMessage: (msg: string) => void;
  // messages is an array of strings representing the messages received from the server
  messages: string[];
}

// Creating the SocketContext with a null initial value
// Creates a new React context with an initial value of null
// This context will be used to share the sendMessage function and messages array with other components
export const SocketContext = createContext<SocketContextValue | null>(null);

// SocketProvider component that manages the WebSocket connection and provides context value
// This is a React component that sets up the WebSocket connection, manages its state, and provides the context value
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Using the useState hook to store the socket instance and the array of messages
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  // Memoized sendMessage function using useCallback
  // The useCallback hook is used to memoize the sendMessage function
  // This ensures that the function is only recreated when the socket instance changes
  const sendMessage = useCallback((msg: string) => {
    // If the socket instance is available, emit the 'newMessage' event with the provided message
    if (socket) {
      socket.emit("newMessage", msg);
    }
  }, [socket]);

  // Setting up WebSocket connection and event listeners
  // The useEffect hook is used to set up the WebSocket connection and event listeners
  useEffect(() => {
    // Create a new WebSocket connection to the server running at http://localhost:3002
    const newSocket = io("http://localhost:3002");
    // Update the socket state with the new socket instance
    setSocket(newSocket);

    // Event listener for 'message' event
    // When the server sends a message, this event listener is triggered
    // The received message is appended to the messages array using the setMessages function
    newSocket.on("message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Event listener for 'user-joined' event
    // When a new user joins the chat, this event listener is triggered
    // The join message is appended to the messages array
    newSocket.on("user-joined", (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    // Event listener for 'user-left' event
    // When a user leaves the chat, this event listener is triggered
    // The leave message is appended to the messages array
    newSocket.on("user-left", (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    // Cleanup function to remove event listeners and disconnect the socket
    // This function is returned from the useEffect hook and will be called when the component unmounts
    // It removes the event listeners and disconnects the WebSocket connection to prevent memory leaks
    return () => {
      newSocket.off("message");
      newSocket.off("user-joined");
      newSocket.off("user-left");
      newSocket.disconnect();
    };
  }, []);

  // Defining the context value object
  // The context value object contains the sendMessage function and the messages array
  const contextValue: SocketContextValue = {
    sendMessage,
    messages,
  };

  // Rendering the SocketContext.Provider with the context value
  // The SocketContext.Provider component provides the context value to its children components
  // Any component wrapped by this provider will have access to the sendMessage function and messages array
  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

// Custom hook to access the SocketContext value
// This is a custom hook that provides a convenient way to access the SocketContext value
export const useSocket = () => {
  // Use the useContext hook to retrieve the context value
  const context = React.useContext(SocketContext);

  // If the context value is null, throw an error
  // This ensures that the useSocket hook is only used within a SocketProvider
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  // Return the context value
  return context;
};
```
`chat.tsx` - `client/src/components/chat.tsx`
```tsx
"use client";
import React, { useEffect, useRef } from "react";
import { useSocket } from "@/context/socket-provider";
import ChatInput from "@/components/chat-input";

const ChatComponent = () => {
// Accessing the messages state from the SocketContext using the useSocket hook
  const { messages } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
// Scrolling to the bottom of the message container whenever the messages state changes
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
```
`chat-input.tsx` - `client/src/components/chat-input.tsx`

```tsx
import React from "react";
import { useSocket } from "@/context/socket-provider";

const ChatInput = () => {
  const [message, setMessage] = React.useState("");
  const { sendMessage } = useSocket();
  // Handling the form submission and sending the message
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
```
`layout.tsx` - `client/src/app/layout.tsx`
```tsx
export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <SocketProvider>
      <body className={inter.className}>{children}</body>
    </SocketProvider>
    </html>
  );
}
```