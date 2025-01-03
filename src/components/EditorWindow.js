import { useTheme } from "@mui/material";
import { useRef } from "react";
import { Editor } from "@monaco-editor/react";
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc'
import { editor } from "monaco-editor";
import randomColor from 'randomcolor';

const serverWsUrl = process.env.REACT_APP_BACKEND_URL;

export default function EditorWindow({socketRef , roomId , username , code, setCode}) {
  const theme = useTheme();

  const editorRef = useRef();

  function handleEditorDidMount(editor) {
    editorRef.current = editor;

    // Initialize yjs
    const doc = new Y.Doc(); // collection of shared objects

    // Connect to peers with WebSocket
    console.log("Signal url", process.env.REACT_APP_SIGNAL_URL)
    const provider = new WebrtcProvider('monaco', doc, {
      signaling: [process.env.REACT_APP_SIGNAL_URL], // Replace with your custom WebSocket server URL
      password: null,
    });
    
    const type = doc.getText("monaco");
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

    // You can think of your own awareness information as a key-value store.
    // We update our "user" field to propagate relevant user information.
    awareness.setLocalStateField('user', {
      name: username,
      color: randomColor()
    })
    // Bind yjs doc to Monaco editor
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
  }

  return (
    <>
      <Editor
        height="60vh"
        language={"cpp"}
        defaultValue={"// your code here"}
        theme={"vs-dark"}
        onMount={handleEditorDidMount}
      />
    </>
  );
}
