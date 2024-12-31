import React from 'react';

function Partner(props) {
  const { videoFrames } = props; // Assuming `videoFrames` is passed in as a prop

  return (
    <div>
      <h3>Partner Video Frames</h3>
      {/* Render all video frames */}
      {videoFrames && videoFrames.length > 0 ? (
        videoFrames.map((frame, index) => (
          <div key={index}>
            <p>Video from Socket ID: {frame.socketId}</p>
            <img 
              src={frame.videoData} 
              alt={`Frame ${index}`} 
              style={{ width: "200px", height: "auto" }}
            />
          </div>
        ))
      ) : (
        <p>No video frames available</p>
      )}
    </div>
  );
}

export default Partner;
