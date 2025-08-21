import { useTheme } from "@mui/material";
import { useRef } from "react";
import { Editor } from "@monaco-editor/react";
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc'
import { editor } from "monaco-editor";
// import randomColor from 'randomcolor';

const serverWsUrl = process.env.REACT_APP_BACKEND_URL;

export default function EditorWindow({socketRef , roomId , username , code, setCode , language}) {
  const theme = useTheme();

  const editorRef = useRef();

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus()

    // Initialize yjs
    const doc = new Y.Doc(); // collection of shared objects

    // Connect to peers with WebSocket
    console.log("Signal url", process.env.REACT_APP_SIGNAL_URL)
    const provider = new WebrtcProvider(roomId, doc, {
  signaling: [
    'wss://signaling.yjs.dev',
    'wss://y-webrtc-signaling-eu.herokuapp.com',
    'wss://y-webrtc-signaling-us.herokuapp.com'
  ],
  password: null,
  peerOpts: {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // STUN
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:relay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:relay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    }
  }
});

    const type = doc.getText(roomId);
    // All of our network providers implement the awareness crdt
    const awareness = provider.awareness

    // You can observe when a user updates their awareness information
    awareness.on("change", (changes) => {
      console.log("Code",editorRef.current.getValue())
      setCode(editorRef.current.getValue())
      const statesArray = Array.from(awareness.getStates());
      statesArray.forEach((state) => {
        const clientId = state[0];
        console.log(state[1]);
        if (state[1].user) {
          const styleSheet = document.createElement("style");
          styleSheet.innerText = `
          .yRemoteSelectionHead-${clientId}{
            border-left: 2px solid ${state[1].user.color} ;
            position:relative;
          }
          .yRemoteSelectionHead-${clientId}::before {
            content: '${state[1].user.name}';
            color: white;
            top: -15px;
            position:absolute;
            left: -2px;
            background-color:${state[1].user.color};
            opacity:0.8;
            font-size:10px;
            padding-left:1px;
            margin-bottom:8px;
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
            border-top-left-radius:5px;

          }
        `;
          document.head.appendChild(styleSheet);
          // console.log("the color is" + state[1].user.color);
        }
      });
    });
function randomColor(){
  let idx = Math.floor(Math.random() * 5);
  console.log(idx);
  const colors = ['#822b2b' , "#269550" , '#132f91' , "#d5d813" , '#d01616']
  return colors[idx]; 
}
    // You can think of your own awareness information as a key-value store.
    // We update our "user" field to propagate relevant user information.
    awareness.setLocalStateField('user', {
      name: username,
      color: randomColor()
    })
    // Bind yjs doc to Monaco editor
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
  }

  console.log("lang",language)
  return (
    <>
      <Editor
        height="60vh"
        width="60vw"
        language={language}
        defaultValue={"//cook your dish here "}
        theme={"vs-dark"}
        onMount={handleEditorDidMount}
      />
    </>
  );
}
