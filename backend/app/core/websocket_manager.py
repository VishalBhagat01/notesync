from typing import Dict, Set, List, Any
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # Maps note_id (int) -> Dict[WebSocket, Dict[str, Any]]
        # where dict contains user metadata e.g. {"user_id": int, "email": str, "name": str}
        self.rooms: Dict[int, Dict[WebSocket, Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, note_id: int, user: Dict[str, Any]):
        await websocket.accept()
        if note_id not in self.rooms:
            self.rooms[note_id] = {}
        
        user_info = {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("name") or user.get("email", "").split("@")[0] or f"User-{user.get('id')}"
        }
        self.rooms[note_id][websocket] = user_info
        
        # Notify room of user presence update
        await self.broadcast_presence(note_id)

    def disconnect(self, websocket: WebSocket, note_id: int):
        if note_id in self.rooms:
            if websocket in self.rooms[note_id]:
                del self.rooms[note_id][websocket]
            if not self.rooms[note_id]:
                del self.rooms[note_id]

    async def broadcast_to_room(self, note_id: int, message: dict, sender: WebSocket = None):
        if note_id not in self.rooms:
            return
        
        data = json.dumps(message)
        to_remove = []
        for connection in list(self.rooms[note_id].keys()):
            if connection != sender:
                try:
                    await connection.send_text(data)
                except Exception:
                    to_remove.append(connection)
        
        for conn in to_remove:
            self.disconnect(conn, note_id)
            
    async def broadcast_presence(self, note_id: int):
        if note_id not in self.rooms:
            return
        
        active_users = list(self.rooms[note_id].values())
        unique_users = []
        seen = set()
        for u in active_users:
            if u["id"] not in seen:
                seen.add(u["id"])
                unique_users.append(u)
                
        message = {
            "type": "presence",
            "users": unique_users
        }
        await self.broadcast_to_room(note_id, message)

manager = ConnectionManager()
