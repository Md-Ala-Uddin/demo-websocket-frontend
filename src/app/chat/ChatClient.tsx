"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";

export default function ChatClient() {
    const [username, setUsername] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, `${data.sender}: ${data.text}`]);
        });

        socket.on("notification", (data) => {
            setNotifications((prev) => [...prev, data.text]);
        });

        socket.on("user_joined", (name) => {
            setNotifications((prev) => [...prev, `${name} joined the chat`]);
        });

        socket.on("user_left", (name) => {
            setNotifications((prev) => [...prev, `${name} left the chat`]);
        });

        socket.on("online_users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("user_typing", (name) => {
            setTypingUsers((prev) => Array.from(new Set([...prev, name])));
        });

        socket.on("user_stop_typing", (name) => {
            setTypingUsers((prev) => prev.filter((n) => n !== name));
        });

        return () => {
            socket.off("receive_message");
            socket.off("notification");
            socket.off("user_joined");
            socket.off("user_left");
            socket.off("online_users");
            socket.off("user_typing");
            socket.off("user_stop_typing");
        };
    }, []);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        socket.emit("typing", username);

        // debounce stop typing
        clearTimeout((window as any)._stopTypingTimer);
        (window as any)._stopTypingTimer = setTimeout(() => {
            socket.emit("stop_typing", username);
        }, 1000);
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        socket.emit("send_message", {
            sender: username,
            text: message,
        });
        setMessages((prev) => [...prev, `You: ${message}`]);
        setMessage("");
    };

    if (!isReady) {
        return (
            <div>
                <input
                    className="border px-2 py-1"
                    placeholder="Your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button
                    className="bg-blue-600 text-white px-4 py-1 ml-2"
                    onClick={() => {
                        if (username.trim()) {
                            setIsReady(true);
                            socket.emit("join", username);
                        }
                    }}
                >
                    Join
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <input
                    className="border px-2 py-1"
                    value={message}
                    onChange={handleTyping}
                    placeholder="Type a message"
                />
                <button
                    className="bg-green-500 text-white px-4 py-1"
                    onClick={sendMessage}
                >
                    Send
                </button>
            </div>

            <div className="my-2">
                <h2 className="font-semibold">
                    Online Users ({onlineUsers.length})
                </h2>
                <ul className="list-disc ml-6 text-green-600">
                    {onlineUsers.map((user, i) => (
                        <li key={i}>{user}</li>
                    ))}
                </ul>
            </div>

            {typingUsers.length > 0 && (
                <p className="text-sm italic text-blue-600">
                    {typingUsers.join(", ")}{" "}
                    {typingUsers.length > 1 ? "are" : "is"} typing...
                </p>
            )}

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
