"""
Unit Tests for Signaling Message Routing Logic

Tests the handle_signaling_message function and all message type handlers.
Validates routing logic, online status checks, error handling, and state transitions.

Requirements Tested:
- 1.5: Route signaling messages between authenticated peers
- 2.4, 2.5, 2.6: Call initiation with online validation
- 3.4, 3.5: Call acceptance and rejection
- 6.3, 6.4, 6.5: Hangup handling
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.websockets.signaling import (
    handle_signaling_message,
    _handle_call_initiate_routing,
    _handle_call_accept_routing,
    _handle_call_reject_routing,
    _handle_sdp_routing,
    _handle_ice_candidate_routing,
    _handle_hangup_routing
)
from app.models.call_session import CallSession, CallState


@pytest.fixture
def mock_connection_manager():
    """Mock ConnectionManager for testing."""
    manager = AsyncMock()
    manager.is_user_connected = MagicMock(return_value=True)
    manager.send_personal_message = AsyncMock()
    return manager


@pytest.fixture
def mock_session_manager():
    """Mock CallSessionManager for testing."""
    manager = MagicMock()
    manager.create_session = MagicMock()
    manager.get_session = MagicMock()
    manager.update_session_status = MagicMock()
    manager.end_session = MagicMock()
    return manager


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock()
    return db


@pytest.fixture
def mock_user():
    """Create a mock user."""
    user = MagicMock()
    user.id = 1
    user.full_name = "Test User"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_call_session():
    """Create a mock call session."""
    session = MagicMock(spec=CallSession)
    session.call_id = "call-123"
    session.caller_id = 1
    session.callee_id = 2
    session.caller_name = "Alice"
    session.callee_name = "Bob"
    session.state = CallState.RINGING
    session.set_state = MagicMock()
    return session


class TestHandleSignalingMessage:
    """Test main signaling message router."""
    
    @pytest.mark.asyncio
    async def test_call_initiate_message(self, mock_connection_manager, mock_session_manager, mock_db):
        """Test that call_initiate messages are routed correctly."""
        message = {
            "type": "call_initiate",
            "call_id": "call-123",
            "callee_id": 2
        }
        
        with patch('app.websockets.signaling._handle_call_initiate_routing', new_callable=AsyncMock) as mock_handler:
            await handle_signaling_message(1, message, mock_connection_manager, mock_session_manager, mock_db)
            mock_handler.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_unknown_message_type(self, mock_connection_manager, mock_session_manager, mock_db):
        """Test that unknown message types send error response."""
        message = {"type": "unknown_type"}
        
        await handle_signaling_message(1, message, mock_connection_manager, mock_session_manager, mock_db)
        
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "error"
        assert "Unknown message type" in call_args[0]["message"]
    
    @pytest.mark.asyncio
    async def test_exception_handling(self, mock_connection_manager, mock_session_manager, mock_db):
        """Test that exceptions are handled gracefully."""
        message = {"type": "call_initiate", "call_id": "call-123"}
        
        with patch('app.websockets.signaling._handle_call_initiate_routing', side_effect=Exception("Test error")):
            await handle_signaling_message(1, message, mock_connection_manager, mock_session_manager, mock_db)
            
            mock_connection_manager.send_personal_message.assert_called_once()
            call_args = mock_connection_manager.send_personal_message.call_args[0]
            assert call_args[0]["type"] == "error"


class TestCallInitiateRouting:
    """Test call initiation routing logic."""
    
    @pytest.mark.asyncio
    async def test_successful_call_initiation(
        self, mock_connection_manager, mock_session_manager, mock_db, mock_user
    ):
        """Test successful call initiation when callee is online."""
        message = {
            "call_id": "call-123",
            "callee_id": 2
        }
        
        # Mock database query
        caller = mock_user
        callee = MagicMock()
        callee.id = 2
        callee.full_name = "Bob"
        callee.email = "bob@example.com"
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [caller, callee]
        
        # Mock session creation
        mock_session = MagicMock()
        mock_session_manager.create_session.return_value = mock_session
        
        await _handle_call_initiate_routing(1, message, mock_connection_manager, mock_session_manager, mock_db)
        
        # Verify session created
        mock_session_manager.create_session.assert_called_once_with(
            call_id="call-123",
            caller_id=1,
            callee_id=2,
            caller_name="Test User",
            callee_name="Bob"
        )
        
        # Verify incoming_call message sent to callee
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "incoming_call"
        assert call_args[1] == 2  # callee_id
    
    @pytest.mark.asyncio
    async def test_call_initiate_callee_offline(
        self, mock_connection_manager, mock_session_manager, mock_db
    ):
        """Test call initiation when callee is offline."""
        message = {
            "call_id": "call-123",
            "callee_id": 2
        }
        
        # Mock callee as offline
        mock_connection_manager.is_user_connected.return_value = False
        
        await _handle_call_initiate_routing(1, message, mock_connection_manager, mock_session_manager, mock_db)
        
        # Verify error sent to caller
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "call_failed"
        assert call_args[0]["reason"] == "user_offline"
        assert call_args[1] == 1  # caller_id
    
    @pytest.mark.asyncio
    async def test_call_initiate_missing_fields(
        self, mock_connection_manager, mock_session_manager, mock_db
    ):
        """Test call initiation with missing required fields."""
        message = {"call_id": "call-123"}  # Missing callee_id
        
        await _handle_call_initiate_routing(1, message, mock_connection_manager, mock_session_manager, mock_db)
        
        # Verify error sent
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "error"


class TestCallAcceptRouting:
    """Test call acceptance routing logic."""
    
    @pytest.mark.asyncio
    async def test_successful_call_accept(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test successful call acceptance."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_call_accept_routing(2, message, mock_connection_manager, mock_session_manager)
        
        # Verify session status updated
        mock_session_manager.update_session_status.assert_called_once_with(
            "call-123", CallState.ACCEPTED.value
        )
        
        # Verify call_accepted message sent to caller
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "call_accepted"
        assert call_args[0]["call_id"] == "call-123"
        assert call_args[1] == 1  # caller_id
    
    @pytest.mark.asyncio
    async def test_call_accept_caller_offline(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test call acceptance when caller goes offline."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = mock_call_session
        mock_connection_manager.is_user_connected.return_value = False
        
        await _handle_call_accept_routing(2, message, mock_connection_manager, mock_session_manager)
        
        # Verify error sent to callee
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "call_failed"
        assert call_args[0]["reason"] == "caller_offline"
        
        # Verify session ended
        mock_session_manager.end_session.assert_called_once_with("call-123")


class TestCallRejectRouting:
    """Test call rejection routing logic."""
    
    @pytest.mark.asyncio
    async def test_successful_call_reject(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test successful call rejection."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_call_reject_routing(2, message, mock_connection_manager, mock_session_manager)
        
        # Verify session status updated
        mock_session_manager.update_session_status.assert_called_once_with(
            "call-123", CallState.REJECTED.value
        )
        
        # Verify call_rejected message sent to caller
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "call_rejected"
        
        # Verify session ended
        mock_session_manager.end_session.assert_called_once_with("call-123")
    
    @pytest.mark.asyncio
    async def test_call_reject_session_not_found(
        self, mock_connection_manager, mock_session_manager
    ):
        """Test call rejection when session doesn't exist."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = None
        
        await _handle_call_reject_routing(2, message, mock_connection_manager, mock_session_manager)
        
        # Should not crash, just log warning
        mock_session_manager.update_session_status.assert_not_called()


class TestSDPRouting:
    """Test SDP offer/answer routing logic."""
    
    @pytest.mark.asyncio
    async def test_sdp_offer_routing(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test SDP offer forwarding."""
        message = {
            "call_id": "call-123",
            "to": 2,
            "sdp": {"type": "offer", "sdp": "v=0..."}
        }
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_sdp_routing(1, message, "sdp_offer", mock_connection_manager, mock_session_manager)
        
        # Verify message forwarded
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "sdp_offer"
        assert call_args[0]["from"] == 1
        assert call_args[1] == 2  # target_user_id
    
    @pytest.mark.asyncio
    async def test_sdp_answer_routing_updates_state(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test SDP answer forwarding updates session to CONNECTED."""
        message = {
            "call_id": "call-123",
            "to": 1,
            "sdp": {"type": "answer", "sdp": "v=0..."}
        }
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_sdp_routing(2, message, "sdp_answer", mock_connection_manager, mock_session_manager)
        
        # Verify session updated to CONNECTED
        mock_session_manager.update_session_status.assert_called_once_with(
            "call-123", CallState.CONNECTED.value
        )
    
    @pytest.mark.asyncio
    async def test_sdp_routing_target_offline(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test SDP routing when target user is offline."""
        message = {
            "call_id": "call-123",
            "to": 2,
            "sdp": {"type": "offer", "sdp": "v=0..."}
        }
        
        mock_session_manager.get_session.return_value = mock_call_session
        mock_connection_manager.is_user_connected.return_value = False
        
        await _handle_sdp_routing(1, message, "sdp_offer", mock_connection_manager, mock_session_manager)
        
        # Verify error sent to sender
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "call_failed"
        assert call_args[0]["reason"] == "peer_offline"


class TestICECandidateRouting:
    """Test ICE candidate routing logic."""
    
    @pytest.mark.asyncio
    async def test_ice_candidate_forwarding(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test ICE candidate forwarding."""
        message = {
            "call_id": "call-123",
            "to": 2,
            "candidate": {"candidate": "candidate:1...", "sdpMid": "0"}
        }
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_ice_candidate_routing(1, message, mock_connection_manager, mock_session_manager)
        
        # Verify candidate forwarded
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "ice_candidate"
        assert call_args[0]["from"] == 1
        assert call_args[1] == 2
    
    @pytest.mark.asyncio
    async def test_ice_candidate_session_not_found(
        self, mock_connection_manager, mock_session_manager
    ):
        """Test ICE candidate when session doesn't exist (call ended)."""
        message = {
            "call_id": "call-123",
            "to": 2,
            "candidate": {"candidate": "candidate:1..."}
        }
        
        mock_session_manager.get_session.return_value = None
        
        await _handle_ice_candidate_routing(1, message, mock_connection_manager, mock_session_manager)
        
        # Should not crash, just skip forwarding
        mock_connection_manager.send_personal_message.assert_not_called()


class TestHangupRouting:
    """Test hangup routing logic."""
    
    @pytest.mark.asyncio
    async def test_successful_hangup(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test successful hangup."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = mock_call_session
        
        await _handle_hangup_routing(1, message, mock_connection_manager, mock_session_manager)
        
        # Verify session status updated to ENDED
        mock_session_manager.update_session_status.assert_called_once_with(
            "call-123", CallState.ENDED.value
        )
        
        # Verify hangup message sent to other peer
        mock_connection_manager.send_personal_message.assert_called_once()
        call_args = mock_connection_manager.send_personal_message.call_args[0]
        assert call_args[0]["type"] == "hangup"
        assert call_args[0]["by"] == 1
        assert call_args[1] == 2  # other_user_id (callee)
        
        # Verify session ended
        mock_session_manager.end_session.assert_called_once_with("call-123")
    
    @pytest.mark.asyncio
    async def test_hangup_other_peer_offline(
        self, mock_connection_manager, mock_session_manager, mock_call_session
    ):
        """Test hangup when other peer is offline."""
        message = {"call_id": "call-123"}
        
        mock_session_manager.get_session.return_value = mock_call_session
        mock_connection_manager.is_user_connected.return_value = False
        
        await _handle_hangup_routing(1, message, mock_connection_manager, mock_session_manager)
        
        # Verify session still ended even if peer offline
        mock_session_manager.end_session.assert_called_once_with("call-123")
        
        # No message sent since peer is offline
        mock_connection_manager.send_personal_message.assert_not_called()
