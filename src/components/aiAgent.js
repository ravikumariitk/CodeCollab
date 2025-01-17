import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios'

function AiAgent({ code , language}) {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Hello! How can I assist you today?' },
    ]);
    const [userInput, setUserInput] = useState('');

    const handleSendMessage = async () => {
        if (userInput.trim() === '') return;

        const newMessages = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');

        const aiResponse = await getAIResponse(userInput);
        setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
    };

    async function getAIResponse(message) {
        try {
            const apiRequestBody = {
                "contents": [
                  {
                    "role": "user",
                    "parts": [
                      {
                        "text": ` ${message} `
                      }
                    ]
                  }
                ],
                "generationConfig": {
                  "temperature": 1,
                  "topK": 40,
                  "topP": 0.95,
                  "maxOutputTokens": 8192,
                  "responseMimeType": "text/plain"
                }
            };

            const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyCl28D4MIbcC-KnnEakRg7linO6K5OzMiE', apiRequestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const aiMessage = response.data.candidates[0].content.parts[0].text;
            
            // Here, we can format the text for a prettier output.
            const formattedText = aiMessage.replace(/(?:\*\*([^*]+)\*\*)/g, "<b>$1</b>")  // Convert **bold** to <b> tags
                                          .replace(/(?:\*([^*]+)\*)/g, "<i>$1</i>")  // Convert *italic* to <i> tags
                                          .replace(/\n/g, "<br>"); // Line breaks for better readability

            return formattedText;

        } catch (error) {
            console.error('Error fetching AI response:', error);
            toast.error('Error fetching AI response');
            return 'Sorry, I encountered an error while processing your request.';
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.chatBox}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.message,
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.sender === 'user' ? '#3a3f51' : '#2c2f3f',
                            color: '#fff',
                        }}
                        dangerouslySetInnerHTML={{ __html: msg.text }} // Render formatted HTML content
                    />
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
                        if (e.code === 'Enter') handleSendMessage();
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
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#1c1e29',
        color: '#fff',
    },
    chatBox: {
        width: '90%',
        height: '87%',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'scroll',
        backgroundColor: '#2c2f3f',
        marginBottom: '10px',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // Internet Explorer 10+
    },
    message: {
        maxWidth: '60%',
        margin: '5px 0',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
    },
    inputBox: {
        display: 'flex',
        flexDirection: 'row',
        width: '91.8%',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: '10px',
        border: '1px solid #444',
        borderRadius: '8px',
        fontSize: '14px',
        backgroundColor: '#2c2f3f',
        color: '#fff',
    },
    sendButton: {
        padding: '10px 20px',
        marginLeft: '10px',
        backgroundColor: '#4aed88',
        color: '#000000',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
    },
};

export default AiAgent;
