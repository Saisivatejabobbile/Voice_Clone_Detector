# VoiceShield Tests

Comprehensive test suite for VoiceShield application.

## Test Categories

### Unit Tests (`unit/`)
Test individual components in isolation:
- Authentication service
- CallManager
- AudioProcessor
- Risk engine
- Model client (mock mode)

### Integration Tests (`integration/`)
Test complete workflows:
- End-to-end call flow
- WebSocket communication
- Privacy guarantees
- Two-user scenarios

## Running Tests

```bash
# All tests
pytest

# Specific category
pytest tests/unit/
pytest tests/integration/

# Specific file
pytest tests/unit/test_auth.py

# Specific test
pytest tests/unit/test_auth.py::test_register_user

# With coverage
pytest --cov=app --cov-report=html

# Verbose output
pytest -v

# Show print statements
pytest -s
```

## Test Structure

```
tests/
├── unit/
│   ├── test_auth.py              # Auth service tests
│   ├── test_call_manager.py      # CallManager tests
│   ├── test_risk_engine.py       # Risk engine tests
│   ├── test_audio_processor.py   # Audio processing tests
│   └── test_model_client.py      # Model client tests
├── integration/
│   ├── test_call_flow.py         # Complete call flow
│   ├── test_websockets.py        # WebSocket tests
│   ├── test_privacy.py           # Privacy verification
│   └── test_two_users.py         # Two-browser simulation
├── conftest.py                   # Pytest fixtures
└── README.md                     # This file
```

## Key Test Cases

### Privacy Tests (`test_privacy.py`)

**Critical tests to verify no audio persistence:**

```python
def test_no_audio_in_database():
    """Verify database has no audio columns."""
    
def test_no_audio_files_created():
    """Verify no audio files written to disk."""
    
def test_buffers_cleared_on_hangup():
    """Verify audio buffers cleared when call ends."""
    
def test_no_audio_in_logs():
    """Verify log files contain no audio data."""
```

### Integration Tests (`test_call_flow.py`)

**Complete workflow test:**

```python
async def test_complete_call_flow():
    """
    Test complete call flow:
    1. User A logs in
    2. User B logs in
    3. User A calls User B
    4. User B accepts call
    5. WebRTC connection established
    6. Remote audio analyzed
    7. Risk updates sent to User B
    8. Call ends
    9. Cleanup verified
    """
```

## Fixtures (`conftest.py`)

Common test fixtures:

```python
@pytest.fixture
def test_db():
    """Test database session."""
    
@pytest.fixture
def test_client():
    """FastAPI test client."""
    
@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    
@pytest.fixture
def mock_model():
    """Mock model client."""
```

## Test Environment

Create `.env.test`:

```env
DATABASE_URL=postgresql://test:test@localhost/voiceshield_test
JWT_SECRET=test-secret
MODEL_MODE=mock
AUDIO_RETENTION=false
```

## Mock Mode Testing

All tests should use `MODEL_MODE=mock` to avoid external dependencies:

```python
@pytest.fixture
def mock_model_client():
    return MockVoiceDetectionModel()
```

## Testing WebSockets

Use `pytest-asyncio` for async tests:

```python
@pytest.mark.asyncio
async def test_signaling_websocket():
    async with websockets.connect(WS_URL) as ws:
        # Test WebSocket communication
        pass
```

## Privacy Verification

### Database Inspection Test

```python
def test_no_audio_columns_in_schema():
    """Verify no audio-related columns exist."""
    inspector = inspect(engine)
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        audio_keywords = ['audio', 'wav', 'mp3', 'pcm', 'recording']
        for col in columns:
            for keyword in audio_keywords:
                assert keyword not in col['name'].lower()
```

### Filesystem Test

```python
def test_no_audio_files_after_call():
    """Verify no audio files created during call."""
    audio_extensions = ['.wav', '.mp3', '.webm', '.pcm']
    for ext in audio_extensions:
        files = glob.glob(f'**/*{ext}', recursive=True)
        assert len(files) == 0, f"Found audio files: {files}"
```

### Memory Cleanup Test

```python
def test_buffer_cleanup_on_call_end():
    """Verify audio buffers are cleared."""
    service = AnalysisService()
    call_id = "test-call-123"
    
    # Simulate audio processing
    service.process_audio_chunk(call_id, [0, 1, 2, 3])
    assert call_id in service.active_buffers
    
    # End call
    service.end_call_analysis(call_id)
    assert call_id not in service.active_buffers
```

## Test Requirements

```
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2
websockets==12.0
```

## Running Specific Test Types

```bash
# Privacy tests only
pytest -k privacy

# WebSocket tests only
pytest -k websocket

# Skip slow integration tests
pytest -m "not slow"

# Run with markers
pytest -m unit
pytest -m integration
```

## Test Markers

Define in `pytest.ini`:

```ini
[pytest]
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests (skip with -m "not slow")
    privacy: Privacy verification tests
```

## Continuous Integration

Tests should run automatically on:
- Every commit (unit tests)
- Every pull request (full suite)
- Before deployment (full suite + privacy tests)

## Coverage Goals

- **Overall:** > 80%
- **Services:** > 90%
- **Models:** > 95%
- **Privacy-critical code:** 100%

## Test Data

Use factories for test data:

```python
def create_test_user():
    return {
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User"
    }

def create_test_call_session():
    return {
        "caller_id": "user-1",
        "receiver_id": "user-2",
        "status": "connected"
    }
```

## Mocking External Services

```python
@pytest.fixture
def mock_external_model(monkeypatch):
    async def mock_predict(audio_data):
        return {
            "synthetic_probability": 0.15,
            "model_confidence": 0.92
        }
    monkeypatch.setattr(
        "app.services.model_client.ExternalVoiceDetectionModel.predict",
        mock_predict
    )
```

## Debugging Tests

```bash
# Stop at first failure
pytest -x

# Enter debugger on failure
pytest --pdb

# Show local variables on failure
pytest -l

# Run last failed tests
pytest --lf
```

## Next Steps

1. Set up pytest configuration
2. Write unit tests for all services
3. Create integration tests for call flow
4. Implement privacy verification tests
5. Set up CI/CD pipeline
6. Add coverage reporting
7. Document test patterns
