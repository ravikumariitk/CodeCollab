import React, { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import toast from 'react-hot-toast';

function Camera({ socketId, clients }) {
  const [peerId, setPeerId] = useState('');
  const remoteVideoRefs = useRef({});
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const localStream = useRef(null); // Store the local media stream
  const [videoEnabled, setVideoEnabled] = useState(true);  // React state for video enable
  const [audioEnabled, setAudioEnabled] = useState(true);  // React state for audio enable
  const retryTimeouts = useRef({}); // Store retry timeouts for unreachable peers

  // useEffect to initialize PeerJS and get user media
  useEffect(() => {
    if (!socketId) return;

    const peer = new Peer(socketId, {
    host: 'codecollabsignalserver.onrender.com',
    port: 443,
    secure: true,
    path: '/',
    });


    peer.on('open', (id) => {
      console.log(`Expected ID: ${socketId}, Assigned Peer ID: ${id}`);
      setPeerId(id);
    });

    peer.on('error', (err) => {
      console.error('Peer.js Error:', err);
      toast.error('Peer connection error. Please try again later.');
    });

    peer.on('call', (call) => {
      if (!localStream.current) return;

      call.answer(localStream.current);

      call.on('stream', (remoteStream) => {
        const videoElement = remoteVideoRefs.current[call.peer];
        if (videoElement) {
          videoElement.srcObject = remoteStream;

          videoElement.onloadedmetadata = () => {
            videoElement.play().catch((err) => {
              console.error('Video play error:', err);
            });
          };
        }
      });

      call.on('error', (err) => {
        console.error(`Error during call with ${call.peer}:`, err);
        toast.error(`Call with ${call.peer} failed.`);
      });
    });

    peerInstance.current = peer;

    // Get initial user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream.current = stream;
        currentUserVideoRef.current.srcObject = stream;
        currentUserVideoRef.current.muted = true; // Mute local video playback

        currentUserVideoRef.current.onloadedmetadata = () => {
          currentUserVideoRef.current
            .play()
            .catch((err) => console.error('Local video play error:', err));
        };
      })
      .catch((err) => {
        console.error('Failed to access user media', err);
        toast.error('Failed to access user media');
      });

    return () => {
      peer.destroy();
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }

      Object.values(retryTimeouts.current).forEach(clearTimeout);
    };
  }, [socketId]);

  // useEffect to trigger call only when new clients join
  useEffect(() => {
    if (clients.length > 0 && localStream.current) {
      clients.forEach((client) => {
        if (client.socketId !== socketId) {
          initiateCallWithRetry(client.socketId, client.socketId);
        }
      });
    }
  }, [clients]);

  const initiateCallWithRetry = useCallback((remotePeerId, socketId, retries = 3) => {
    if (retries <= 0) {
      console.warn(`Failed to connect to peer ${remotePeerId} after multiple attempts.`);
      toast.error(`Unable to connect to ${socketId} after several retries.`);
      return;
    }

    console.log(`Attempting to call ${remotePeerId}. Remaining retries: ${retries}`);

    const call = peerInstance.current.call(remotePeerId, localStream.current);

    call.on('stream', (remoteStream) => {
      const videoElement = remoteVideoRefs.current[socketId];
      if (videoElement) {
        videoElement.srcObject = remoteStream;
        if (videoElement.paused) {
          videoElement.play().catch((err) => {
            console.error('Remote video play error:', err);
          });
        }
      }
    });

    call.on('error', (err) => {
      console.error(`Call to ${remotePeerId} failed:`, err);
      toast.error(`Call to ${socketId} failed. Retrying...`);

      // Retry after a delay
      retryTimeouts.current[socketId] = setTimeout(() => {
        initiateCallWithRetry(remotePeerId, socketId, retries - 1);
      }, 3000); // Retry after 3 seconds
    });

    // Clear the retry timeout on success
    call.on('close', () => {
      if (retryTimeouts.current[socketId]) {
        clearTimeout(retryTimeouts.current[socketId]);
      }
    });
  }, []);

  const handleAudio = () => {
    setAudioEnabled((prevAudioState) => {
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          toast.success(audioTrack.enabled ? 'You are now unmuted' : 'You are now muted');
        }
      }
      return !prevAudioState;
    });
  };

  const handleVideo = () => {
    setVideoEnabled((prevVideoState) => {
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          toast.success(videoTrack.enabled ? 'You are now visible' : 'You are now hidden');
        }
      }
      return !prevVideoState;
    });
  };

  return (
    <div>
      <div className="container">
        <video className="video" ref={currentUserVideoRef} />
        <button onClick={handleAudio}>
          {audioEnabled ? 'Mute' : 'Unmute'}
        </button>
        &nbsp;
        <button onClick={handleVideo}>
          {videoEnabled ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="Container">
        {clients.map((element) => {
          if (element.socketId !== socketId) {
            return (
              <div key={element.socketId}>
                <p>{element.username}</p>
                <video
                  className="video"
                  ref={(el) => (remoteVideoRefs.current[element.socketId] = el)}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default Camera;
