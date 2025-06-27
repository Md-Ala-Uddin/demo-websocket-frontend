'use client';

import { useEffect, useState } from 'react';
import socket from '@/lib/socket';

export default function ChatPage() {
  const [username, setUsername] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, `${data.sender}: ${data.text}`]);
    });

    socket.on('notification', (data) => {
      setNotifications((prev) => [...prev, data.text]);
    });

    return () => {
      socket.off('receive_message');
      socket.off('notification');
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('send_message', {
      sender: username,
      text: message,
    });
    setMessages((prev) => [...prev, `You: ${message}`]); // show own message immediately
    setMessage('');
  };

  if (!isReady) {
    return (
      <div className="p-6">
        <h1 className="text-xl mb-4">Enter your name to join chat</h1>
        <input
          className="border px-2 py-1"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-1 ml-2"
          onClick={() => username.trim() && setIsReady(true)}
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Welcome, {username}</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button className="bg-green-500 text-white px-4 py-1" onClick={sendMessage}>
          Send
        </button>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Messages</h2>
        <ul className="list-disc ml-6">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Notifications</h2>
        <ul className="list-disc ml-6 text-yellow-600">
          {notifications.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
