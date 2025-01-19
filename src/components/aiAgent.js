import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";

function AiAgent({ code, language, useCode }) {
    const [messages, setMessages] = useState([
        { sender: "ai", text: "Hello! How can I assist you today?" },
    ]);
    const [userInput, setUserInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const chatBoxRef = useRef(null);  // Reference for the chat box

    const handleSendMessage = async () => {
        if (userInput.trim() === "") return;

        const newMessages = [...messages, { sender: "user", text: userInput }];
        setMessages(newMessages);
        setUserInput("");

        setIsThinking(true);

        const aiResponse = await getAIResponse(userInput);
        setMessages([...newMessages, { sender: "ai", text: aiResponse }]);

        setIsThinking(false);
    };

    async function getAIResponse(message) {
        if (useCode) {
            message = `Based on the following code : ${code} answer the question : ${message} in ${language} language, and if the question is not related to the code don't consider the code as input prompt.`;
        }
        try {
            const apiRequestBody = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: ` ${message} `,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain",
                },
            };

            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyCl28D4MIbcC-KnnEakRg7linO6K5OzMiE",
                apiRequestBody,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const aiMessage = (response.data.candidates[0].content.parts[0].text).replace(/(?:\*\*([^*]+)\*\*)/g, '<b>$1</b>') // Convert **bold** to <b> tags
                .replace(/(?:\*([^*]+)\*)/g, '<i>$1</i>') // Convert *italic* to <i> tags
                .replace(/\n/g, '<br>');;

            return aiMessage;
        } catch (error) {
            console.error("Error fetching AI response:", error);
            toast.error("Error fetching AI response");
            return "Sorry, I encountered an error while processing your request.";
        }
    }

    // Scroll to the bottom whenever the messages state changes
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
                            ...styles.message,
                            alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                            backgroundColor: msg.sender === "user" ? "#3a3f51" : "#0078FF",
                            color: "#fff",
                        }}
                        dangerouslySetInnerHTML={{ __html: msg.text }} // Use this to render HTML content
                    />
                ))}

                {isThinking && (
                    <div style={styles.thinkingBubble}>
                        Thinking...
                    </div>
                )}
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
        color: "#ffffff",
    },
    chatBox: {
        width: "90%",
        height: "87%",
        border: "1px solid #333",
        borderRadius: "12px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        overflowY: "scroll",
        backgroundColor: "#2c2f3f",
        marginBottom: "10px",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
    },
    message: {
        maxWidth: "70%",
        margin: "5px 0",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        lineHeight: "1.5",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    },
    thinkingBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#0078FF",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        margin: "5px 0",
        fontStyle: "italic",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    },
    inputBox: {
        display: "flex",
        flexDirection: "row",
        width: "92.5%",
        alignItems: "center",
    },
    input: {
        flex: 1,
        padding: "10px",
        border: "1px solid #333",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "#2c2f3f",
        color: "#ffffff",
        outline: "none",
    },
    sendButton: {
        padding: "10px 20px",
        marginLeft: "10px",
        backgroundColor: "#0078FF",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
    },
};

export default AiAgent;
