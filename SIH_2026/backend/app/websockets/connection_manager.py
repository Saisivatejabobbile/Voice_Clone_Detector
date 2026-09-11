"""
Connection Manager
Manages WebSocket connections and user presence
"""

from fastapi import WebSocket
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for all users
    Tracks user_id → WebSocket mapping
    """
    
    def __init__(self):
        # user_id → WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        
        # user_id → user_info (for quick access)
        self.user_info: Dict[int, dict] = {}
    
    @staticmethod
    def _normalize_user_id(user_id):
        try:
            return int(user_id)
        except (ValueError, TypeError):
            return user_id

    async def connect(self, websocket: WebSocket, user_id: int, user_info: dict):
        """
        Connect a user's WebSocket
        
        Args:
            websocket: WebSocket connection
            user_id: User ID
            user_info: User information (name, email, etc.)
        """
        await websocket.accept()
        uid = self._normalize_user_id(user_id)
        self.active_connections[uid] = websocket
        self.user_info[uid] = user_info
        
        logger.info(f"User {uid} ({user_info.get('full_name')}) connected to signaling")
        logger.info(f"Total active connections: {len(self.active_connections)}")
    
    def disconnect(self, user_id: int):
        """
        Disconnect a user's WebSocket
        
        Args:
            user_id: User ID to disconnect
        """
        uid = self._normalize_user_id(user_id)
        if uid in self.active_connections:
            del self.active_connections[uid]
        
        if uid in self.user_info:
            user_name = self.user_info[uid].get('full_name', 'Unknown')
            del self.user_info[uid]
            logger.info(f"User {uid} ({user_name}) disconnected from signaling")
        
        logger.info(f"Total active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """
        Send a message to a specific user
        
        Args:
            message: Message dict to send
            user_id: Target user ID
        """
        uid = self._normalize_user_id(user_id)
        websocket = self.active_connections.get(uid)
        if not websocket:
            try:
                websocket = self.active_connections.get(int(user_id))
            except (ValueError, TypeError):
                websocket = self.active_connections.get(str(user_id))

        if websocket:
            try:
                await websocket.send_json(message)
                logger.debug(f"Sent message to user {uid}: {message.get('type')}")
            except Exception as e:
                logger.error(f"Error sending message to user {uid}: {e}")
                # Connection might be dead, disconnect it
                self.disconnect(uid)
        else:
            logger.warning(f"User {uid} not connected, cannot send message {message.get('type')}. Active connections: {list(self.active_connections.keys())}")
    
    async def broadcast(self, message: dict, exclude_user: Optional[int] = None):
        """
        Broadcast a message to all connected users
        
        Args:
            message: Message dict to broadcast
            exclude_user: Optional user ID to exclude from broadcast
        """
        disconnected_users = []
        exclude_uid = self._normalize_user_id(exclude_user) if exclude_user is not None else None
        
        for user_id, websocket in self.active_connections.items():
            if exclude_uid and user_id == exclude_uid:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up dead connections
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    def is_user_connected(self, user_id: int) -> bool:
        """
        Check if a user is connected
        
        Args:
            user_id: User ID to check
            
        Returns:
            True if connected, False otherwise
        """
        uid = self._normalize_user_id(user_id)
        if uid in self.active_connections:
            return True
        try:
            return int(user_id) in self.active_connections
        except (ValueError, TypeError):
            return str(user_id) in self.active_connections
    
    def get_online_users(self) -> List[dict]:
        """
        Get list of all online users
        
        Returns:
            List of user info dicts
        """
        return list(self.user_info.values())
    
    def get_user_info(self, user_id: int) -> Optional[dict]:
        """
        Get user info by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User info dict or None
        """
        uid = self._normalize_user_id(user_id)
        return self.user_info.get(uid)


# Global connection manager instance
signaling_manager = ConnectionManager()
