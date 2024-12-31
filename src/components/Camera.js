import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 200,
  facingMode: "environment"
};

const Camera = ({ socket_ref , roomId }) => {
  const webcamRef = useRef(null);
  const [url, setUrl] = React.useState(null);
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(true); // Default video is visible
  const [stream, setStream] = useState(null);

  const capturePhoto = React.useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setUrl(imageSrc);
  }, [webcamRef]);

  const onUserMedia = (e) => {
    console.log(e);
  };

  // Initialize webcam stream when video is shown
  useEffect(() => {
    const initializeWebcam = () => {
        navigator.mediaDevices
          .getUserMedia({ video: videoConstraints, audio })
          .then((stream) => {
            if (webcamRef.current) {
              webcamRef.current.video.srcObject = stream;
              setStream(stream);
              // Start emitting video frames to the server
              sendVideoStream(stream);
            }
          })
          .catch((err) => {
            console.error("Error starting webcam:", err);
          });
      };
      
      initializeWebcam();
    return () => {
        cleanupWebcam();
    }
  }, [video,audio])


  // Cleanup webcam stream when video is hidden
  const cleanupWebcam = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setStream(null); // Clear the stream state
    }
  };


  function handleAudio() {
    // setAudio(!audio);
  }

  function handleVideo() {
    // if (!video) {
    //   initializeWebcam();
    // } else {
    //   cleanupWebcam();
    // }
    // setVideo(!video); // Toggle video visibility
  }

  // Send webcam video frames to the server
  const sendVideoStream = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    const videoStream = new MediaStream([videoTrack]);
    const videoElement = document.createElement("video");
    videoElement.srcObject = videoStream;
    console.log("socke",socket_ref)
    // When the video element starts playing, capture frames and send them
    videoElement.onplay = () => {
      setInterval(() => {
        if (socket_ref) {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL("image/jpeg"); // Convert to base64 string
            console.log("Emmiting ")
          // Emit the frame data to the server
          const data ={frameData: frameData, roomId:roomId , socketId : socket_ref.current.id }
          console.log(data)
          socket_ref.current.emit("video-stream", data);
        }
      }, 100); // Send a frame every 100ms (adjust as needed)
    };

    videoElement.play();
  };

  return (
    <>
      <div className="VideoDiv">
        {video && (
          <Webcam
            ref={webcamRef}
            audio={audio}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={onUserMedia}
          />
        )}
      </div>
      <button onClick={handleAudio}>{audio ? "Mute" : "Unmute"}</button> &nbsp;
      <button onClick={handleVideo}>{video ? "Hide" : "Show"} Video</button>
      {url && (
        <div>
          <img src={url} alt="Screenshot" />
        </div>
      )}
    </>
  );
};
export default Camera;