import { useTheme } from "@mui/material";
import { useRef } from "react";
import { Editor } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness";

export default function EditorWindow({ socketRef, roomId, username, code, setCode, language }) {
  const theme = useTheme();
  const editorRef = useRef();

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();

    // Create Yjs document
    const ydoc = new Y.Doc();
    const type = ydoc.getText("monaco");

    // Awareness for cursor and user presence
    const awareness = new Awareness(ydoc);
    awareness.setLocalStateField("user", {
      name: username,
      color: randomColor()
    });

    // Bind Monaco editor with Yjs shared text type
    new MonacoBinding(type, editor.getModel(), new Set([editor]), awareness);

    // Join the room on Socket.IO
    socketRef.current.emit("JOIN", { roomId, username });

    // Apply Yjs updates coming from server
    socketRef.current.on("yjs-update", (update) => {
      Y.applyUpdate(ydoc, update);
    });

    // Apply awareness updates from server
    socketRef.current.on("awareness-update", (update) => {
      awareness.applyUpdate(update, socketRef.current.id);
    });

    // Send Yjs updates to server when local changes happen
    ydoc.on("update", (update) => {
      socketRef.current.emit("yjs-update", { roomId, update });
    });

    // Broadcast awareness updates to server
    awareness.on("update", () => {
      const update = encodeAwarenessUpdate(
        awareness,
        Array.from(awareness.getStates().keys())
      );
      socketRef.current.emit("awareness-update", { roomId, update });
    });

    // Update React state when code changes
    editor.onDidChangeModelContent(() => {
      setCode(editorRef.current.getValue());
    });
  }

  function randomColor() {
    const colors = ["#822b2b", "#269550", "#132f91", "#d5d813", "#d01616"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <>
      <Editor
        height="60vh"
        width="60vw"
        language={language}
        defaultValue={"// Start coding here..."}
        theme={"vs-dark"}
        onMount={handleEditorDidMount}
      />
    </>
  );
}
