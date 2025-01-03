import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CodemirrorBinding } from 'y-codemirror';
import 'codemirror/mode/javascript/javascript.js';

const CodeCollabEditor = () => {
  const [connected, setConnected] = useState(false);
  const editorContainerRef = useRef(null);
  const connectButtonRef = useRef(null);
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev/ws', // use the public ws server
      'codemirror-demo-2024/06',
      ydoc
    );
    const ytext = ydoc.getText('codemirror');
    const editor = CodeMirror(editorContainerRef.current, {
      mode: 'javascript',
      lineNumbers: true
    });

    // Create the binding
    bindingRef.current = new CodemirrorBinding(ytext, editor, provider.awareness);
    editorRef.current = editor;

    // Cleanup on unmount
    return () => {
      provider.destroy();
      editor.toTextArea();
    };
  }, []);

  const handleConnectClick = () => {
    const provider = bindingRef.current?.provider;

    if (provider?.shouldConnect) {
      provider.disconnect();
      setConnected(false);
      if (connectButtonRef.current) {
        connectButtonRef.current.textContent = 'Connect';
      }
    } else {
      provider.connect();
      setConnected(true);
      if (connectButtonRef.current) {
        connectButtonRef.current.textContent = 'Disconnect';
      }
    }
  };

  return (
    <div>
      <button
        ref={connectButtonRef}
        onClick={handleConnectClick}
        id="y-connect-btn"
      >
        Connect
      </button>
      <div ref={editorContainerRef} id="editor" style={{ height: '500px' }} />
    </div>
  );
};

export default CodeCollabEditor;



const WebSocket = require('ws');
const { WebsocketProvider } = require('y-websocket');
const Y = require('yjs');

// Create a WebSocket server on port 1234
const wss = new WebSocket.Server({ port: 1234 });

// In-memory Yjs document store
const docStore = new Map();

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Create a new Yjs document for each connection
  const ydoc = new Y.Doc();
  docStore.set(ws, ydoc);

  // Handle incoming messages
  ws.on('message', (message) => {
    // Handle syncing and broadcast messages
    const data = JSON.parse(message);
    const { docName, updates } = data;

    // Find the document by name and apply updates
    if (!docStore.has(ws)) {
      return;
    }

    const currentDoc = docStore.get(ws);
    currentDoc.getText(docName).applyUpdate(updates);
  });

  // Cleanup when client disconnects
  ws.on('close', () => {
    docStore.delete(ws);
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:1234');
