"use client";
import { useEffect, useRef, useState, useMemo } from "react";

export default function RealtimeDetection() {
  const videoRef = useRef(null);
  const [websocket, setWebsocket] = useState(null);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch available cameras from the backend on the client only
  useEffect(() => {
    if (isClient) {
      const fetchCameras = async () => {
        try {
          const response = await fetch("http://localhost:8000/cameras");
          const data = await response.json();
          setCameras(data.cameras);
          if (data.cameras.length > 0) {
            setCameraIndex(data.cameras[0].index);
          }
        } catch (err) {
          console.error("Error fetching cameras:", err);
          setError("Could not load cameras");
        }
      };
      fetchCameras();
    }
  }, [isClient]);

  // Initialize WebSocket connection only when detection starts
  useEffect(() => {
    if (isDetecting && cameraIndex !== null) {
      const ws = new WebSocket(`ws://localhost:8000/ws?camera=${cameraIndex}`);
      setWebsocket(ws);

      ws.onmessage = (event) => {
        try {
          const blob = new Blob([event.data], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          if (videoRef.current.src) {
            URL.revokeObjectURL(videoRef.current.src);
          }
          videoRef.current.src = url;
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Failed to connect to WebSocket");
        setIsDetecting(false);
        ws.close();
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

      return () => {
        if (ws) ws.close();
      };
    }
  }, [cameraIndex, isDetecting]);

  const handleCameraChange = (e) => {
    setCameraIndex(parseInt(e.target.value));
  };

  const handleStart = () => {
    setIsDetecting(true);
  };

  const handleStop = () => {
    setIsDetecting(false);
    if (websocket) {
      websocket.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-10 text-gray-800">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-gray-800">
        <h1 className="text-2xl font-semibold text-center mb-6">Real-time Object Detection</h1>

        <div className="mb-5">
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : cameras.length > 0 ? (
            <div className="flex flex-col items-center">
              <label className="text-lg font-medium mb-2">Select Camera:</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-300 focus:outline-none"
                onChange={handleCameraChange}
                value={cameraIndex}
              >
                {cameras.map((camera) => (
                  <option key={camera.index} value={camera.index}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-center">Loading cameras...</div>
          )}
        </div>

        <div className="text-center mb-5">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleStart}
            disabled={isDetecting}
          >
            {isDetecting ? "Detection Started" : "Start Detection"}
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 ml-4"
            onClick={handleStop}
            disabled={!isDetecting}
          >
            Stop Detection
          </button>
        </div>

        <div className="rounded-md border border-gray-300 shadow-sm overflow-hidden w-full h-64 flex items-center justify-center bg-gray-50">
          <img ref={videoRef} alt="Real-time detection" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
