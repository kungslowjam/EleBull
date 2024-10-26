from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
import cv2
from ultralytics import YOLO
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

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

# Check and list available cameras
def get_available_cameras(max_index=5):
    cameras = []
    for index in range(max_index):
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            cameras.append({"label": f"Camera {index}", "index": index})
        cap.release()
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

            # Object detection using YOLOv8
            results = model(frame)
            annotated_frame = results[0].plot()

            # Encode the image as JPEG
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_bytes = buffer.tobytes()

            try:
                await websocket.send_bytes(frame_bytes)
            except WebSocketDisconnect:
                print(f"Client disconnected from camera {camera}")
                break

            # Add delay to control the frame rate
            await asyncio.sleep(0.03)

    finally:
        cap.release()
        await websocket.close()
