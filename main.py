import os
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ProcessPoolExecutor
from ultralytics import YOLO
import asyncio
import time

app = FastAPI()

# Set OpenCV logging level to suppress warnings
os.environ["OPENCV_LOG_LEVEL"] = "ERROR"  # This will suppress warnings and only show errors

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Cache for camera list with expiration time
camera_cache = None
cache_expiry_time = 300  # Cache lasts for 5 minutes

# Function to check if a camera is available at a given index
def check_camera(index):
    cap = cv2.VideoCapture(index)
    if cap.isOpened():
        label = f"Camera {index}"
        cap.release()
        return {"label": label, "index": index}
    return None

# Optimized function to find available cameras with caching
def get_available_cameras(max_index=3):
    global camera_cache
    
    # Check if cache is still valid
    current_time = time.time()
    if camera_cache and (current_time - camera_cache['timestamp'] < cache_expiry_time):
        return camera_cache['cameras']
    
    cameras = []
    with ProcessPoolExecutor() as executor:
        results = executor.map(check_camera, range(max_index))
    
    cameras = [cam for cam in results if cam]
    camera_cache = {
        "cameras": cameras,
        "timestamp": current_time
    }
    return cameras

# Endpoint to send available cameras to frontend
@app.get("/cameras")
async def get_cameras():
    return {"cameras": get_available_cameras()}

# WebSocket endpoint for real-time object detection
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, camera: int = Query(0)):
    await websocket.accept()

    cap = cv2.VideoCapture(camera)
    if not cap.isOpened():
        await websocket.send_text("Failed to open camera")
        await websocket.close()
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"Failed to read frame from camera {camera}.")
                break

            # Perform object detection using YOLO
            results = model(frame)
            annotated_frame = results[0].plot()

            # Encode the annotated frame as JPEG
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_bytes = buffer.tobytes()

            try:
                await websocket.send_bytes(frame_bytes)
            except WebSocketDisconnect:
                print(f"Client disconnected from camera {camera}")
                break

            # Control frame rate
            await asyncio.sleep(0.03)

    finally:
        cap.release()
        await websocket.close()
    