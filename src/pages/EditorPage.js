import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import axios from 'axios';
import Webcam from "react-webcam"
import Camera from '../components/Camera';
import Partner from '../components/Partner';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

// const WebcamComponent = () => <Webcam />
const EditorPage = () => {
    const [run, setRun] = useState("Run Code");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [code, setCode] = useState("")
    const [language, setLanguage] = useState("cpp")
    const [theme, setTheme] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [partnerVideo, setPartnerVideo] = useState([]);

    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            // console.log("socket",socketRef.current)
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                // console.log('socket error', e);
                toast.error('Connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        // console.log(`${username} joined`);
                    }
                    setClients(clients);
                    // console.log("Clients : ",clients)
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );
            socketRef.current.on(
                'video-incoming',
                ({ videoFrame,socketId, username }) => {
                    // console.log("Getting video from : ", username);
                    setPartnerVideo((prev)=>{
                       for(let i=0;i<prev.length;i++){
                          if(prev[i].socketId === socketId)
                          {
                            prev[i].videoData = videoFrame
                            return [...prev];
                          }
                       }
                       
                       
                    //    console.log("wewewefwe",clients,socketId)
                    
                        return [...prev,{videoData:videoFrame, socketId : socketId , username : username}]
                    });
                }
            );
            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setPartnerVideo((prev)=>{
                        for(let i=0;i<prev.length;i++){
                           if(prev[i].socketId === socketId)
                           {
                             prev.splice(i,1);
                             return prev;
                           }
                        }
                     });
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    const runCode = async () => {

        try {
            setIsRunning(true)
            toast.success('Code Submitted');
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language, // Language like 'python', 'javascript', 'cpp'
                version: '*', // Latest version
                files: [{ name: 'main', content: code }], // Code content
                stdin: input, // Standard input
            });
            // Output result
            const { run } = response.data;
            // console.log(response)
            setIsRunning(false)
            if (!run.stdout) toast.error('Compilation Failed');
            else toast.success('Compilation Successful');
            setOutput(run.stdout || run.stderr || 'No output');
        } catch (error) {
            setOutput('Error: Unable to execute the code');
        }
    };
    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    {/* <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div> */}
                   <Camera socket_ref={socketRef} roomId = {roomId}> </Camera>
                   <Partner videoFrames = {partnerVideo} ></Partner>
                </div>
                <button className="btn leaveBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                    setCode={setCode}
                    theme
                    language
                />
               <div className="codeTerminal">
  <div className="terminalHeader">
    <span>
      Language: 
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="cpp">C++</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
      </select>
    </span>
    {/* <span>
      Theme: 
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dracula">Dracula</option>
        <option value="material">Material</option>
      </select>
    </span> */}
    <span>
      <button 
        disabled={isRunning} 
        className="runButton" 
        onClick={runCode}>
        {isRunning ? "Running..." : "Run Code"}
      </button>
    </span>
  </div>

  <div className="terminalBody">
    <div className="inputSection">
      <label>Input:</label>
      <textarea 
        rows="4" 
        placeholder="Enter input here..." 
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
    </div>

    <div className="outputSection">
      <label>Output:</label>
      <textarea 
        rows="6" 
        readOnly 
        value={output} 
        placeholder="Output will be displayed here..."
      ></textarea>
    </div>
  </div>
</div>
            </div>
        
        </div>
    );
};

export default EditorPage;
