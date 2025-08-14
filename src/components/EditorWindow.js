import { useTheme } from "@mui/material";
import { useRef } from "react";
import { Editor } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

export default function EditorWindow({ roomId, username, setCode, language }) {
  const theme = useTheme();
  const editorRef = useRef();

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();

    // ✅ Initialize Yjs Doc
    const doc = new Y.Doc();

    // ✅ Create WebRTC Provider with signaling & STUN
    const provider = new WebrtcProvider(roomId, doc, {
      signaling: ["wss://codecollabsignalserver.onrender.com"],
      peerOpts: {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" }, // STUN
            // You can add TURN here for guaranteed connectivity:
            // {
            //   urls: "turn:your-turn-server",
            //   username: "user",
            //   credential: "pass"
            // }
          ]
        }
      }
    });

    // ✅ Shared text type
    const type = doc.getText(roomId);

    // ✅ Awareness for cursors & user info
    const awareness = provider.awareness;
    awareness.setLocalStateField("user", {
      name: username,
      color: randomColor()
    });

    awareness.on("change", () => {
      setCode(editorRef.current.getValue());
    });

    // ✅ Bind Monaco Editor
    new MonacoBinding(type, editor.getModel(), new Set([editor]), awareness);
  }

  function randomColor() {
    const colors = ["#822b2b", "#269550", "#132f91", "#d5d813", "#d01616"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <Editor
      height="60vh"
      width="60vw"
      language={language}
      defaultValue="// Start coding here"
      theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
      onMount={handleEditorDidMount}
    />
  );
}
