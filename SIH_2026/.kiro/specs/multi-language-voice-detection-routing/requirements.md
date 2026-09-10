# Requirements Document

## Introduction

This document defines requirements for integrating multiple external voice-detection APIs into the VoiceShield real-time call analysis pipeline. The system SHALL route audio to language-specific AI models based on automatic language identification, enabling accurate synthetic voice detection across multiple spoken languages.

## Glossary

- **Audio_Buffer**: Per-call-session accumulator that collects PCM chunks into analyzable windows
- **Audio_Worklet_Processor**: Browser-side AudioWorklet module that captures and preprocesses audio in real-time (frontend/public/audioProcessor.js)
- **Analysis_Router**: Backend WebSocket handler that receives audio chunks and orchestrates analysis (backend/app/websockets/analysis.py)
- **AI_Analyzer_Service**: Service layer that interfaces with external voice detection models (backend/app/services/ai_analyzer.py)
- **Language_Identifier**: In-process component that determines spoken language from audio samples
- **Model_Router**: Component that selects the appropriate voice detection model based on detected language
- **Call_Session**: A single WebRTC call identified by unique call_id
- **PCM_Chunk**: Raw audio data fragment (4096 samples at 16kHz, approximately 0.256 seconds)
- **Buffer_Window**: Configurable time interval (default 5 seconds) for accumulating audio before analysis
- **WAV_Encoder**: Component that converts accumulated PCM data into WAV file format
- **Risk_Dashboard**: Frontend component that displays real-time risk analysis (frontend/src/components/call/RiskDashboard.jsx)
- **Call_History**: Database table storing completed call metadata and risk analysis results
- **Model_Client**: HTTP client wrapper for communicating with external voice detection APIs
- **Risk_Mapper**: Component that converts model-specific confidence scores to standardized LOW/MEDIUM/HIGH risk levels

## Requirements

### Requirement 1: Audio Buffer Management

**User Story:** As a system, I want to accumulate incoming PCM chunks into analyzable windows, so that I can send sufficient audio data to voice detection models for accurate analysis.

#### Acceptance Criteria

1. WHEN a PCM chunk arrives for a call_id, THE Audio_Buffer SHALL accumulate the chunk in a per-call-session buffer
2. THE Audio_Buffer SHALL track accumulated duration using sample count and sample rate
3. WHEN accumulated duration reaches BUFFER_WINDOW_SECONDS (default 5 seconds), THE Audio_Buffer SHALL mark the buffer as ready for analysis
4. WHEN a buffer is marked ready, THE WAV_Encoder SHALL convert the accumulated PCM data into WAV format (16kHz, 16-bit, mono)
5. WHEN encoding completes, THE Audio_Buffer SHALL clear the accumulated data and continue accumulating for the next window
6. THE Audio_Buffer SHALL maintain isolation by keying all buffer state by call_id
7. WHEN a call ends cleanly, THE Audio_Buffer SHALL remove the buffer entry for that call_id
8. THE Audio_Buffer SHALL perform periodic cleanup sweeps (every 60 seconds) to remove buffers untouched for more than 60 seconds
9. THE BUFFER_WINDOW_SECONDS configuration SHALL be loaded from environment variables with a default value of 5 seconds

### Requirement 2: Language Identification

**User Story:** As a system, I want to identify the spoken language in each audio window, so that I can route audio to the correct language-specific voice detection model.

#### Acceptance Criteria

1. WHEN an audio buffer is ready for analysis, THE Language_Identifier SHALL process the WAV data to detect the spoken language
2. THE Language_Identifier SHALL use a lightweight in-process language identification model (e.g., SpeechBrain VoxLingua107)
3. THE Language_Identifier SHALL return a language code (ISO 639-1 format) and confidence score
4. IF the language identification confidence is below a configurable threshold, THE Language_Identifier SHALL return the top two candidate languages with their confidence scores
5. THE Language_Identifier SHALL process each buffer window independently (approximately every BUFFER_WINDOW_SECONDS)
6. THE Language_Identifier SHALL handle mid-call language switching by re-identifying language for each new buffer window
7. THE Language_Identifier SHALL complete processing within 500 milliseconds to minimize detection latency

### Requirement 3: Model Configuration and Routing

**User Story:** As a system administrator, I want to configure multiple language-specific voice detection models, so that the system can route audio to the appropriate model based on detected language.

#### Acceptance Criteria

1. THE Model_Router SHALL load model configuration from LANGUAGE_MODEL_MAP environment variable
2. THE LANGUAGE_MODEL_MAP SHALL define for each language: API URL, risk_low threshold, and risk_high threshold
3. THE LANGUAGE_MODEL_MAP SHALL include entries for English (voice-detector-api-production.up.railway.app) and placeholders for two additional models
4. WHEN a language is identified with high confidence, THE Model_Router SHALL route the audio to the model corresponding to that language code in LANGUAGE_MODEL_MAP
5. IF the detected language has no entry in LANGUAGE_MODEL_MAP, THE Model_Router SHALL mark the result as "unsupported language" and skip risk analysis
6. IF language identification returns low confidence with multiple candidates, THE Model_Router SHALL route audio to all candidate models and select the highest risk result
7. WHEN routing to multiple models due to low confidence, THE Model_Router SHALL mark the result with "low-confidence" flag
8. THE Model_Router SHALL route each buffer window to exactly one model (or multiple models only for ambiguous language detection)

### Requirement 4: External Model Integration

**User Story:** As a system, I want to send audio data to external voice detection APIs and receive risk assessments, so that I can detect synthetic voices in real-time calls.

#### Acceptance Criteria

1. THE Model_Client SHALL send HTTP POST requests to /api/analyze endpoint for each configured model
2. THE Model_Client SHALL include the WAV audio data in the request payload
3. THE Model_Client SHALL implement a timeout of 10 seconds for each API request
4. THE Model_Client SHALL verify model availability by sending GET requests to /health endpoint
5. WHEN a model returns a response, THE Model_Client SHALL log the complete raw response for initial calls (first 10 responses per model)
6. IF a model request fails or times out, THE Model_Client SHALL return an error status and allow the call to continue without risk analysis for that window
7. THE Model_Client SHALL handle concurrent requests for multiple active calls independently
8. THE Model_Client SHALL retry failed requests up to 2 times with exponential backoff (1 second, 2 seconds)

### Requirement 5: Risk Score Mapping

**User Story:** As a system, I want to convert model-specific confidence scores to standardized risk levels, so that the frontend displays consistent risk indicators across all models.

#### Acceptance Criteria

1. WHEN a model returns a response, THE Risk_Mapper SHALL extract the confidence score from the response
2. THE Risk_Mapper SHALL use the model-specific risk_low and risk_high thresholds from LANGUAGE_MODEL_MAP
3. IF confidence is less than risk_low, THE Risk_Mapper SHALL assign risk level "LOW"
4. IF confidence is greater than or equal to risk_low and less than risk_high, THE Risk_Mapper SHALL assign risk level "MEDIUM"
5. IF confidence is greater than or equal to risk_high, THE Risk_Mapper SHALL assign risk level "HIGH"
6. THE Risk_Mapper SHALL preserve the original model confidence score alongside the mapped risk level
7. THE Risk_Mapper SHALL handle varying response schema field names (e.g., "confidence", "score", "probability") by attempting multiple field name patterns
8. IF the response schema cannot be parsed, THE Risk_Mapper SHALL log the raw response and return an error status

### Requirement 6: Risk Stabilization

**User Story:** As a user, I want stable risk indicators that don't flicker between levels, so that I can make informed decisions without confusion.

#### Acceptance Criteria

1. THE Analysis_Router SHALL track the risk level for the previous two consecutive buffer windows
2. WHEN a new risk level is determined, THE Analysis_Router SHALL compare it with the previous two results
3. IF the new risk level differs from both previous levels, THE Analysis_Router SHALL hold the update and wait for the next window
4. IF two consecutive windows agree on the same risk level, THE Analysis_Router SHALL broadcast the risk update via WebSocket
5. WHERE risk stabilization is enabled (configurable via ENABLE_RISK_STABILIZATION environment variable), THE Analysis_Router SHALL apply the two-window agreement rule
6. WHERE risk stabilization is disabled, THE Analysis_Router SHALL broadcast every risk level immediately
7. THE ENABLE_RISK_STABILIZATION configuration SHALL default to true

### Requirement 7: Real-Time Risk Broadcasting

**User Story:** As a call participant, I want to see real-time risk updates during the call, so that I can react immediately to potential threats.

#### Acceptance Criteria

1. WHEN risk analysis completes for a buffer window, THE Analysis_Router SHALL send a risk_update message via the WebSocket connection for that call_id
2. THE risk_update message SHALL include: risk_level, risk_score, model_confidence, detected_language, model_used, timestamp, and recommendation text
3. THE Analysis_Router SHALL include acoustic_indicators and prosody_indicators from the model response in the risk_update message
4. THE Analysis_Router SHALL broadcast risk updates to all WebSocket connections associated with the call_id (both caller and callee)
5. WHEN a risk update is received, THE Risk_Dashboard SHALL update the display within 100 milliseconds
6. THE Risk_Dashboard SHALL display the detected language alongside the risk level
7. IF a risk update is marked "low-confidence", THE Risk_Dashboard SHALL display a confidence indicator to the user

### Requirement 8: Call History Persistence

**User Story:** As a user, I want completed call risk analysis results stored in my call history, so that I can review past calls and identify patterns.

#### Acceptance Criteria

1. WHEN risk analysis completes for a buffer window, THE Analysis_Router SHALL append a record to the Call_History table
2. THE Call_History record SHALL include: call_id, timestamp, detected_language, raw_model_response, mapped_risk_level, model_used, and buffer_window_number
3. THE Call_History table SHALL store multiple risk analysis records per call (one per buffer window)
4. WHEN a call ends, THE Analysis_Router SHALL calculate and store an aggregate risk assessment (highest risk level observed, average risk score, language distribution)
5. THE Call_History query API SHALL return both per-window details and aggregate statistics
6. THE Call_History persistence SHALL operate asynchronously to avoid blocking real-time analysis

### Requirement 9: Audio Format Verification and Conversion

**User Story:** As a system, I want to ensure audio format compatibility with all external models, so that analysis requests succeed consistently.

#### Acceptance Criteria

1. THE Audio_Worklet_Processor SHALL downsample captured audio from browser native rate (44.1kHz or 48kHz) to 16kHz
2. THE Audio_Worklet_Processor SHALL convert stereo audio to mono by averaging channels
3. THE Audio_Worklet_Processor SHALL output PCM data in Int16 format with values in range [-32768, 32767]
4. THE WAV_Encoder SHALL create WAV files with format: 16kHz sample rate, 16-bit depth, mono channel, PCM encoding
5. IF a model requires a different audio format, THE Model_Client SHALL perform format conversion before sending the request
6. THE Model_Client SHALL verify expected audio format for each model by checking model documentation or configuration
7. THE Audio_Buffer SHALL validate incoming PCM chunks have expected sample rate (16kHz) and data type (Int16)

### Requirement 10: Configuration Management

**User Story:** As a system administrator, I want to configure model endpoints and analysis parameters via environment variables, so that I can adjust the system without code changes.

#### Acceptance Criteria

1. THE AI_Analyzer_Service SHALL load VOICE_DETECTOR_API_URL from environment variables for the English model
2. THE AI_Analyzer_Service SHALL load FRIEND_MODEL_1_URL and FRIEND_MODEL_2_URL from environment variables with placeholder defaults
3. THE Audio_Buffer SHALL load BUFFER_WINDOW_SECONDS from environment variables with default value of 5
4. THE Language_Identifier SHALL load LANGUAGE_ID_CONFIDENCE_THRESHOLD from environment variables with default value of 0.7
5. THE Model_Router SHALL parse LANGUAGE_MODEL_MAP from environment variables in JSON format
6. THE Model_Client SHALL load MODEL_TIMEOUT_SECONDS from environment variables with default value of 10
7. THE Analysis_Router SHALL load ENABLE_RISK_STABILIZATION from environment variables with default value of true
8. THE Audio_Buffer SHALL load BUFFER_CLEANUP_INTERVAL_SECONDS from environment variables with default value of 60

### Requirement 11: Health Check and Monitoring

**User Story:** As a system administrator, I want to monitor the health of external voice detection APIs, so that I can detect and respond to service outages.

#### Acceptance Criteria

1. THE Model_Client SHALL perform GET /health requests to each configured model during system startup
2. THE Model_Client SHALL log the health check result (success/failure) for each model
3. THE Model_Client SHALL perform periodic health checks (every 5 minutes) for all configured models
4. IF a model health check fails, THE Model_Client SHALL log a warning and mark that model as unavailable
5. WHEN routing audio to an unavailable model, THE Model_Router SHALL skip that model and return "model unavailable" status
6. THE Analysis_Router SHALL expose a /status endpoint that returns: active call count, buffer statistics, model availability status, and analysis throughput metrics
7. THE Model_Client SHALL track and report: request count, success rate, average response time, and error rate per model

### Requirement 12: Concurrent Call Handling

**User Story:** As a system, I want to handle multiple simultaneous calls independently, so that users experience consistent performance regardless of system load.

#### Acceptance Criteria

1. THE Audio_Buffer SHALL maintain separate buffer state for each call_id in a dictionary structure
2. THE Analysis_Router SHALL process audio chunks for different call_ids in parallel using asynchronous operations
3. THE Model_Client SHALL limit concurrent requests per model to 5 using a semaphore or connection pool
4. IF concurrent request limit is reached, THE Model_Client SHALL queue additional requests with a maximum queue size of 20
5. THE Language_Identifier SHALL support concurrent language identification for multiple call sessions
6. THE Analysis_Router SHALL track active analysis sessions and report count via monitoring endpoint
7. THE Audio_Buffer SHALL handle race conditions when multiple chunks arrive simultaneously for the same call_id using asyncio locks

### Requirement 13: Error Handling and Graceful Degradation

**User Story:** As a user, I want calls to continue even when voice detection fails, so that technical issues don't disrupt communication.

#### Acceptance Criteria

1. IF language identification fails, THE Analysis_Router SHALL log the error and continue the call without risk analysis for that window
2. IF all configured models are unavailable, THE Analysis_Router SHALL send a status message to the client indicating "analysis unavailable"
3. IF a model request times out, THE Model_Client SHALL cancel the request and return an error status without blocking subsequent windows
4. IF the Audio_Buffer reaches memory limits (>100MB per call), THE Audio_Buffer SHALL discard oldest data and log a warning
5. IF WAV encoding fails, THE WAV_Encoder SHALL log the error with diagnostic information and skip that buffer window
6. IF WebSocket connection is lost during analysis, THE Analysis_Router SHALL cleanup buffer state and cancel pending model requests for that call_id
7. THE Analysis_Router SHALL send analysis_status messages with state "ERROR" and descriptive error messages when failures occur
8. IF risk mapping fails due to unexpected response schema, THE Risk_Mapper SHALL attempt fallback parsing strategies before returning error

### Requirement 14: Testing and Validation

**User Story:** As a developer, I want comprehensive testing tools, so that I can verify the system works correctly across different scenarios.

#### Acceptance Criteria

1. THE Model_Client SHALL provide a test_model_health function that verifies GET /health for each configured model
2. THE Analysis_Router SHALL provide a test_end_to_end function that processes a sample audio file through the complete pipeline
3. THE Language_Identifier SHALL provide a test_language_detection function that verifies language identification accuracy with known audio samples
4. THE Audio_Buffer SHALL provide a test_buffer_isolation function that verifies concurrent calls maintain separate buffer state
5. THE Audio_Buffer SHALL provide a test_orphan_cleanup function that verifies abandoned buffers are cleaned up after timeout
6. THE Model_Router SHALL provide a test_language_routing function that verifies audio is routed to correct models based on language
7. THE test suite SHALL include audio samples in at least 3 different languages for integration testing
8. THE test suite SHALL simulate 5 concurrent calls to verify buffer isolation and concurrent handling

### Requirement 15: Language Identification Model Integration

**User Story:** As a system, I want to load and use a language identification model efficiently, so that I can detect languages without external API calls.

#### Acceptance Criteria

1. THE Language_Identifier SHALL load the SpeechBrain VoxLingua107 model during system initialization
2. THE Language_Identifier SHALL use GPU acceleration if available (CUDA), otherwise fall back to CPU
3. THE Language_Identifier SHALL load the model once globally and reuse for all call sessions
4. THE Language_Identifier SHALL validate the model loads successfully during startup and log any errors
5. IF the language identification model fails to load, THE Language_Identifier SHALL fall back to a default language (English) and log a warning
6. THE Language_Identifier SHALL support at least 10 common languages (en, es, fr, de, it, pt, zh, hi, ar, ja)
7. THE Language_Identifier SHALL cache model artifacts locally to avoid re-downloading on subsequent startups

### Requirement 16: WAV Encoding

**User Story:** As a system, I want to convert accumulated PCM data into WAV format efficiently, so that I can send properly formatted audio to external models.

#### Acceptance Criteria

1. THE WAV_Encoder SHALL accept a list of Int16 PCM samples and sample rate as input
2. THE WAV_Encoder SHALL generate a WAV file in memory (bytes buffer) without writing to disk
3. THE WAV_Encoder SHALL create WAV headers with correct: sample rate, bit depth (16), number of channels (1), and data chunk size
4. THE WAV_Encoder SHALL handle PCM data of varying lengths (1-10 seconds)
5. THE WAV_Encoder SHALL validate input PCM data is in Int16 range [-32768, 32767]
6. THE WAV_Encoder SHALL complete encoding within 100 milliseconds for a 5-second audio buffer
7. THE WAV_Encoder SHALL use the Python wave module or equivalent for standards-compliant WAV generation

### Requirement 17: Model Response Logging

**User Story:** As a developer, I want to log raw model responses during initial deployment, so that I can verify response schemas and adjust parsing logic.

#### Acceptance Criteria

1. THE Model_Client SHALL maintain a response log counter per model
2. WHEN the response log counter is less than 10, THE Model_Client SHALL log the complete raw response body
3. THE Model_Client SHALL include in logs: model URL, detected language, response status code, response body, and timestamp
4. THE Model_Client SHALL log responses at INFO level for successful requests and ERROR level for failed requests
5. WHEN the response log counter reaches 10, THE Model_Client SHALL log only error responses for that model
6. THE Model_Client SHALL provide a reset_response_logging function to restart detailed logging if needed
7. THE logged responses SHALL be formatted as JSON for easy parsing and analysis

### Requirement 18: Risk Recommendation Generation

**User Story:** As a call participant, I want clear recommendations based on risk level, so that I know how to respond to potential threats.

#### Acceptance Criteria

1. WHEN risk level is "LOW", THE Risk_Mapper SHALL generate recommendation: "This voice appears to be human. No suspicious patterns detected."
2. WHEN risk level is "MEDIUM", THE Risk_Mapper SHALL generate recommendation: "Voice shows some characteristics that may indicate AI generation. Proceed with caution and verify caller identity through other means."
3. WHEN risk level is "HIGH", THE Risk_Mapper SHALL generate recommendation: "This voice is likely AI-generated. Exercise extreme caution. Do not share sensitive information and consider ending the call."
4. WHERE a result is marked "low-confidence", THE Risk_Mapper SHALL append to recommendation: " (Note: Language detection confidence was low)"
5. WHERE a result is marked "unsupported language", THE Risk_Mapper SHALL generate recommendation: "Unable to analyze - spoken language is not supported. Proceed with caution."
6. THE Risk_Mapper SHALL include the detected language in the recommendation text
7. THE recommendation text SHALL be included in both WebSocket risk_update messages and Call_History records
