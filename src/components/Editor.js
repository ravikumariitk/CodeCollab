import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import ACTIONS from '../Actions';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import * as Y from 'yjs';

const Editor = ({ socketRef, roomId, onCodeChange, setCode, theme, language, ydoc }) => {
    const editorRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState(null);

    useEffect(() => {
        // Initialize the editor
        editorRef.current = Codemirror.fromTextArea(
            document.getElementById('realtimeEditor'),
            {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            }
        );
        editorRef.current.setSize('100%', '50px');

        // Track the cursor position
       
        // Synchronize editor with Yjs
        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();

            if (origin !== 'setValue') {
                // Apply change to Yjs document (encode as update)
                const update = Y.encodeStateAsUpdate(ydoc.current); // Encode state as an update
                Y.applyUpdate(ydoc.current, update); // Apply update to Yjs document

                socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
            }

            onCodeChange(code); // Call the parent callback to handle code change
        });

    }, []);

    useEffect(() => {
        // Listen for code updates from other users via socket
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                    if (cursorPosition && cursorPosition.line !== undefined && cursorPosition.ch !== undefined) {
                        console.log("curson updated")
                        editorRef.current.setCursor(cursorPosition);
                    }
                    const update = Y.encodeStateAsUpdate(ydoc.current); // Encode update
                    Y.applyUpdate(ydoc.current, update); // Apply update to Yjs
                }
            });
        }
        editorRef.current.on('cursorActivity', () => {
            const cursor = editorRef.current.getCursor();
            const cursorPosition = {
                line: cursor.line,
                ch: cursor.ch,
            };
            console.log(cursorPosition)
            setCursorPosition(cursorPosition);  // Save cursor position
        });


        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    // Restore cursor position after update
    useEffect(() => {
        if (cursorPosition) {
            editorRef.current.setCursor(cursorPosition.line, cursorPosition.ch);
        }
    }, [ydoc.current]); // Trigger cursor restore after each Yjs update

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
