import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/EditorWindow';
import { initSocket } from '../socket';
import Peer from 'peerjs'
import axios from 'axios';
import Camera from '../components/Camera';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import WhiteBoard from '../components/WhiteBoard';
import AiAgent from '../components/aiAgent';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';
import { use } from 'react';
import Chat from '../components/Chat';
const EditorPage = () => {
    const [run, setRun] = useState("Run Code");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [code, setCode] = useState("")
    const [language, setLanguage] = useState("cpp")
    const [theme, setTheme] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [socketId , setSocketId] = useState("")
    const [peerId , setPeerId] = useState('')
    const[isDownloaded , setIsDownloaded] = useState(false)
    const[isDownloading , setIsDownloading] = useState(false)
    const [canvas, setCanvas] = useState("none");
    const [ai, setAi] = useState("none");
    const [useCode, setUseCode] = useState(false);


    const ydoc = useRef(new Y.Doc());
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));
            // console.log("Socket Id", socketRef.current.id)
            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }else{
                        console.log("Socket ID :",socketId)
                        setSocketId(socketId);
                    }
                    setClients(clients);
                }
            );
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
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
    async function getAiResponse(){
        try{
            const apiRequestBody = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Based on the code : ${code} generate random a testcase just give me the test case nothing else if the code doest have input then reponse.`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: 'text/plain',
                },
            };

            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyCl28D4MIbcC-KnnEakRg7linO6K5OzMiE',
                apiRequestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.candidates[0].content.parts[0].text;
            // console.log(aiMessage);
        }catch(error){
            toast.error("Something went wrong! please try again")
        }
    }
    const createRandomTestCases = async(e) => {
        e.preventDefault();
        const response = await getAiResponse();
        setInput(response)
        console.log(input,response)
        document.getElementById("input").value = response
        toast.success("Test case generated")
    }
    const runCode = async () => {
        try {
            setIsRunning(true)
            console.log(code)
            toast.success('Code Submitted');
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language, // Language like 'python', 'javascript', 'cpp'
                version: '*', // Latest version
                files: [{ name: 'main', content: code }], // Code content
                stdin: input, // Standard input
            });
            // Output result
            const { run } = response.data;
            console.log(response)
            setIsRunning(false)
            if (!run.stdout) toast.error('Compilation Failed! You can ask AI Assistant to resolve the issue');
            else toast.success('Compilation Successful');
            setOutput(run.stdout || run.stderr || 'No output');
        } catch (error) {
            setOutput('Error: Unable to execute the code');
            setIsRunning(false)
        }
    };
    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }
      function downloadCode(){
        setIsDownloading(true);
        setTimeout(() => {
            function getExtension(lang){
                if(lang == 'javascript') return "js";
                if(lang == 'python') return "py";
                if(lang == 'cpp') return "cpp";
            }
            const blob = new Blob([code], { type: 'text/plain' }); // text/plain for C++ code
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `program.${getExtension(language)}`; // You can change the file name here
            link.click();
            setIsDownloading(false);
            setIsDownloaded(true)
        }, 1000);
       
    }
    return (
        
        <div className="mainWrap">
            
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/logo-dark1.png"
                            alt="logo"
                        />
                    </div>
                    <br />
                    {/* <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div> */}

                <><Camera socketId = {socketId} clients = {clients}></Camera></>
                </div>
                <button className="btn runButton" onClick={()=>{
                    if(ai === 'none') {
                        setAi('block')
                        toast.success('AI Assistant Opened');
                    }
                    else {
                        setAi('none')
                        toast.success('AI Assistant Closed');
                    }
                }}>
                {ai === 'none'? "Open AI Assistant": "Close AI Assistant"}
                </button>
                <br />
                <button className="btn runButton" onClick={()=>{
                    console.log("Opening Canvas")
                    if(canvas === 'none') {
                        setCanvas('block')
                        toast.success('Canvas Opened');
                    }
                    else {
                        setCanvas('none')
                        toast.success('Canvas Closed');
                    }
                }}>{canvas === 'none'? "Open Canvas": "Close Canvas"}</button>
                <br />
                <button className="btn runButton" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>

            <div className = 'middle'>
            <div style={{display:ai}}>
            <AiAgent code = {code} language = {language} useCode = {useCode}></AiAgent>
            </div>
            <WhiteBoard canvas = {canvas} setCanvas = {setCanvas} roomId={roomId}></WhiteBoard>
            <div className="editorWrap" style={{ display :  (ai=='none' && canvas == 'none')?'block':'none'}}>
              <Editor socketRef = {socketRef} roomId = {roomId} username = {location.state?.username} code = {code} setCode = {setCode} language= {language}></Editor>
                <div className="codeTerminal">
                    <div className="terminalHeader">
                        <span>
                            Language:&nbsp;
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                            </select>
                        </span>
                        <span> <input type="checkbox" onChange = {(e)=>{
                            if (e.target.checked) {
                                setUseCode(true)
                              } else {
                                setUseCode(false)
                              }
                        }}/> Use my code for AI assistant</span>
                        <span>
                           &nbsp; <button
                                disabled={isRunning}
                                className="runButton"
                                onClick={runCode}>
                                {isRunning ? "Running..." : "Run Code"}
                            </button>
                            &nbsp;
                            <button
                                disabled={isRunning}
                                className="runButton"
                                onClick={downloadCode}>
                                {isDownloaded ? "Download Again" : (isDownloading? "Downloading...":"Download Code")}
                            </button>
                        </span>
                    </div>

                    <div className="terminalBody">
                        <div className="inputSection">
                            <label>Input:  <a
                            onClick={createRandomTestCases}
                            href=""
                            className="createNewBtn"
                        >Generate a random testcase</a></label>
                            <textarea
                                id = "input"
                                rows="4" 
                                placeholder="Enter input here..."
                                onChange={(e) => setInput(e.target.value)
                                }
                            ></textarea>
                        </div>
                        <div className="outputSection">
                            <label>Output:</label>
                            <textarea
                                rows="7"
                                readOnly
                                value={output}
                                placeholder="Output will be displayed here..."
                            ></textarea>
                        </div>
                    </div>
                </div>

            </div>
            </div>
            <div className = "right"><Chat roomId = {roomId} username = {location.state?.username} socketRef ={socketRef}></Chat></div>
        </div>
    );
};

export default EditorPage;
