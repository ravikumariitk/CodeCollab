import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";

function Chat({ roomId, username, socketRef }) {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const chatBoxRef = useRef(null); // Create a reference to the chat box

    const handleSendMessage = () => {
        if (userInput.trim() === "") return;
        const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "You", text: userInput, time: timestamp },
        ]);
        socketRef.current.emit("chat", {
            roomId,
            username,
            text: userInput,
        });
        setUserInput("");
    };

    useEffect(() => {
        setTimeout(() => {
            if (socketRef.current) {
                const messageListener = ({ userName, text }) => {
                    console.log("Message received:", userName, text); // Debugging
                    const timestamp = new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
        
                    if (userName !== username) {
                        toast.success(`New Message from ${userName}`)
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            { sender: userName, text, time: timestamp },
                        ]);
                    }
                };
        
                socketRef.current.on("chat-r", messageListener);
        
                return () => {
                    console.log("Cleaning up listener");
                    socketRef.current.off("chat-r", messageListener);
                };
            } else {
                console.error("SocketRef is not connected"); // Debugging
            }
        }, 2000);
        
    }, [socketRef, username]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]); 

    return (
        <div style={styles.container}>
            <div ref={chatBoxRef} style={styles.chatBox}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.messageContainer,
                            alignSelf: msg.sender === "You" ? "flex-end" : "flex-start",
                        }}
                    >
                        <div
                            style={{
                                ...styles.message,
                                backgroundColor: msg.sender === "You" ? "#DCF8C6" : "#FFFFFF",
                            }}
                        >
                            <span style={styles.username}>
                                {msg.sender !== "You" ? msg.sender : ""}
                            </span>
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(msg.text),
                                }}
                                style={styles.text}
                            />
                            <span style={styles.timestamp}>{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.inputBox}>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    style={styles.input}
                    onKeyUp={(e) => {
                        if (e.code === "Enter") handleSendMessage();
                    }}
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>
                    Send
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#1c1e29",
        color: "#000",
    },
    chatBox: {
        width: "90%",
        height: "87%",
        border: "1px solid #2c2f3f",
        borderRadius: "8px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        overflowY: "scroll",
        scrollbarWidth: "none",
        backgroundColor: "#2c2f3f",
        marginBottom: "10px",
    },
    messageContainer: {
        display: "flex",
        flexDirection: "column",
        margin: "5px 0",
        maxWidth: "90%",
        minwidth: "100px",
    },
    message: {
        padding: "10px",
        borderRadius: "8px",
        fontSize: "14px",
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    username: {
        fontWeight: "bold",
        fontSize: "12px",
        marginBottom: "5px",
        display: "block",
        color: "#007AFF",
    },
    text: {
        wordWrap: "break-word",
        fontSize: "14px",
        color: "#000",
        marginBottom: "",
    },
    timestamp: {
        fontSize: "10px",
        color: "#555",
        marginTop: "5px",
        alignSelf: "flex-end",
        textAlign: "right",
    },
    inputBox: {
        display: "flex",
        flexDirection: "row",
        width: "95%",
        alignItems: "center",
    },
    input: {
        flex: 1,
        padding: "10px",
        border: "1px solid #2c2f3f",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "#2c2f3f",
        color: "#FFFFFF",
    },
    sendButton: {
        padding: "10px 20px",
        marginLeft: "10px",
        backgroundColor: "#4aed88",
        color: "",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
    },
};

export default Chat;
