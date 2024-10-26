"use client";
import { useEffect, useRef, useState } from "react";

export default function RealtimeDetection() {
  const videoRef = useRef(null);
  const [websocket, setWebsocket] = useState(null);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState(null);

  // ดึงรายการกล้องจาก backend
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch("http://localhost:8000/cameras");
        const data = await response.json();
        setCameras(data.cameras);
        if (data.cameras.length > 0) {
          setCameraIndex(data.cameras[0].index);
        }
      } catch (err) {
        console.error(err);
        setError("Could not load cameras");
      }
    };

    fetchCameras();
  }, []);

  useEffect(() => {
    let ws;
    if (isStarted && cameraIndex !== null) {
      ws = new WebSocket(`ws://localhost:8000/ws?camera=${cameraIndex}`);
      setWebsocket(ws);

      ws.onmessage = (event) => {
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        videoRef.current.src = url;
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [cameraIndex, isStarted]);

  const handleCameraChange = (e) => {
    setCameraIndex(parseInt(e.target.value));
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-10 text-gray-800">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-gray-800">
        <h1 className="text-2xl font-semibold text-center mb-6">Real-time Object Detection</h1>

        {/* Dropdown สำหรับเลือกกล้อง */}
        <div className="mb-5">
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <div className="flex flex-col items-center">
              <label className="text-lg font-medium mb-2">Select Camera:</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-300 focus:outline-none"
                onChange={handleCameraChange}
                value={cameraIndex}
              >
                {cameras.length > 0 ? (
                  cameras.map((camera) => (
                    <option key={camera.index} value={camera.index}>
                      {camera.label}
                    </option>
                  ))
                ) : (
                  <option>Loading cameras...</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* ปุ่ม Start เพื่อเริ่มการตรวจจับ */}
        <div className="text-center mb-5">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleStart}
            disabled={isStarted}
          >
            {isStarted ? "Detection Started" : "Start Detection"}
          </button>
        </div>

        {/* การแสดงผลวิดีโอ */}
        <div className="rounded-md border border-gray-300 shadow-sm overflow-hidden w-full h-64 flex items-center justify-center bg-gray-50">
          <img ref={videoRef} alt="Real-time detection" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
