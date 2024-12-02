from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json

app = FastAPI()

# Update CORS configuration for Netlify
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aws-sensor.netlify.app",  # Replace with your Netlify domain
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store last 100 readings in memory
readings = []
MAX_READINGS = 100

@app.get("/")
async def root():
    return {"message": "SHT31 Sensor API"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            sensor_data = json.loads(data)
            
            # Add timestamp
            sensor_data["timestamp"] = datetime.utcnow().isoformat()
            
            # Store in memory
            readings.append(sensor_data)
            if len(readings) > MAX_READINGS:
                readings.pop(0)
            
            # Broadcast to all connected clients
            await websocket.send_json(sensor_data)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()

@app.get("/readings")
async def get_readings():
    return readings 