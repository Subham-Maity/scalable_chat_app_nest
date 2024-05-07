# Step 1 : Basic Setup (Communication Server-Client)

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