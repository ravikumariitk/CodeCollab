import React from 'react';

function Partner(props) {
  const { videoFrames } = props; // Assuming `videoFrames` is passed in as a prop
  // console.log("kjerbvkwej : ", videoFrames)
  return (
    <div>
      <h3>You are With : </h3>
      {/* Render all video frames */}
      {videoFrames && videoFrames.length > 0 ? (
        videoFrames.map((frame, index) => (
          <div key={index}>
            <p>{frame.username}</p>
            <img 
              src={frame.videoData}
              alt={`Frame ${index}`}
              style={{ width: "200px", height: "auto" }}
            />
          </div>
        ))
      ) : (
        <p>Coding alone :(</p>
      )}
    </div>
  );
}

export default Partner;
