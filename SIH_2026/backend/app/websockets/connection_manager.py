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
    
    async def connect(self, websocket: WebSocket, user_id: int, user_info: dict):
        """
        Connect a user's WebSocket
        
        Args:
            websocket: WebSocket connection
            user_id: User ID
            user_info: User information (name, email, etc.)
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_info[user_id] = user_info
        
        logger.info(f"User {user_id} ({user_info.get('full_name')}) connected to signaling")
        logger.info(f"Total active connections: {len(self.active_connections)}")
    
    def disconnect(self, user_id: int):
        """
        Disconnect a user's WebSocket
        
        Args:
            user_id: User ID to disconnect
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        if user_id in self.user_info:
            user_name = self.user_info[user_id].get('full_name', 'Unknown')
            del self.user_info[user_id]
            logger.info(f"User {user_id} ({user_name}) disconnected from signaling")
        
        logger.info(f"Total active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """
        Send a message to a specific user
        
        Args:
            message: Message dict to send
            user_id: Target user ID
        """
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
                logger.debug(f"Sent message to user {user_id}: {message.get('type')}")
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                # Connection might be dead, disconnect it
                self.disconnect(user_id)
        else:
            logger.warning(f"User {user_id} not connected, cannot send message")
    
    async def broadcast(self, message: dict, exclude_user: Optional[int] = None):
        """
        Broadcast a message to all connected users
        
        Args:
            message: Message dict to broadcast
            exclude_user: Optional user ID to exclude from broadcast
        """
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
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
            bool: True if user is connected
        """
        return user_id in self.active_connections
    
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
        return self.user_info.get(user_id)


# Global connection manager instance
signaling_manager = ConnectionManager()
