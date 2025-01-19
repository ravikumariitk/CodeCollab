# CodeCollab 🎥💬

**CodeCollab** is a real-time multi-user code editor with integrated video and audio call capabilities. It enables seamless collaboration, allowing multiple participants to code together in a shared environment while communicating via high-quality video and audio calls.

## Features 🚀

- **Shared IDE**: Collaborate with multiple participants in a single integrated development environment.
- **Real-time Video & Audio**: Connect with peers using live video and audio streams.
- **Shared White Canvas**: Collaborate visually using a shared whiteboard for sketches, diagrams, or notes.
- **AI Debugging**: Leverage Gemini AI to debug code in real-time and enhance collaboration efficiency.
- **Test Case Generator**: Automatically generate test cases to ensure your code performs as expected.
- **Chat Box**: Engage in seamless text-based communication with peers for quick discussions and feedback
- **Peer-to-Peer Communication**: Powered by [PeerJS](https://peerjs.com) for efficient, scalable communication.
- **Retry Mechanism**: Automatically retries failed connections to ensure a reliable user experience.
- **Media Controls**: Mute/unmute audio and hide/show video with intuitive controls.
- **Responsive Design**: Adapts to various screen sizes for a smooth user experience.

---

## Live Demo ✈️

[app-codecollab.onrender.com/ ](https://app-codecollab.onrender.com/)

---

## Technologies Used 🛠️

- **Frontend**: React.js
- **Backend**: Node.js
- **Peer-to-Peer Communication**: PeerJS
- **Notifications**: react-hot-toast
- **Media Streaming**: WebRTC APIs (`getUserMedia`)
- **Collaboration**: Conflict-free replicated data types ([Yjs](https://github.com/yjs/yjs))
- **AI Debugging**: Gemini AI
- **Styling**: CSS

---

## Prerequisites 🖍️

- Node.js (v14 or above)
- NPM or Yarn
- A modern web browser (Google Chrome, Mozilla Firefox, etc.)

---

## Installation 🖥️

1. Clone the repository:
   ```bash
   git clone https://github.com/ravikumariitk/CodeCollab.git
   cd CodeTogether
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## How to Use 📖

1. **Start the App**:
   - Launch the app in your browser after starting the development server.

2. **Join a Room**:
   - Each participant joins the session with a unique identifier.

3. **Interact**:
   - Enable/disable video and audio as required using the control buttons.

4. **Collaborate**:
   - Start coding with other participants in the shared IDE or use the shared white canvas for visual collaboration.

5. **Debug with AI**:
   - Use the Gemini AI feature to debug and optimize code in real time.

6. **Reconnect on Failure**:
   - The app automatically retries to establish the connection if it fails.

---

## Project Structure 🔃

```plaintext
CodeTogether/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── Camera.js       # Core video conferencing logic
│   │   ├── EditorWindow.js # Shared IDE component
│   │   ├── WhiteBoard.js   # Shared white canvas component
│   │   └── aiAgent.js      # AI debugging logic
│   ├── App.js              # Main application component
│   └── index.js            # React DOM renderer
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

---

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add a meaningful commit message"
   ```
4. Push the branch:
   ```bash
   git push origin feature-name
   ```
5. Create a pull request.

---

## Known Issues 🐞

- Occasional delays during peer reconnections.
- Limited browser support for older versions.

---

## Future Enhancements 🛠️

- Support for screen sharing.
- Improved UI/UX design.
- Enhanced AI capabilities for code suggestions and optimizations.

---

## Acknowledgments 🙏

- [PeerJS](https://peerjs.com)
- [React](https://reactjs.org)
- [WebRTC](https://webrtc.org)
- [Yjs](https://github.com/yjs/yjs)
- [Gemini AI](https://gemini.com)

---

## Contact 📨

Feel free to reach out for any questions or feedback:

- **Author**: Ravi Kumar  
- **GitHub**: [ravikumariitk](https://github.com/ravikumariitk)

Happy Coding! 🎉
