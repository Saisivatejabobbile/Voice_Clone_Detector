# Bugfix Requirements Document

## Introduction

The VoiceShield application's login and signup functionality fails immediately when users attempt to authenticate. The issue manifests as an "unable to fetch" error that appears as soon as the user clicks the Login or Signup button. This bug prevents all users from accessing the application, blocking the core authentication flow.

The root cause is a **port mismatch configuration error**: the frontend is configured to connect to the backend API at `http://localhost:8001`, but the backend server is actually running on port `8000`. This causes all authentication API calls to fail with network connection errors.

## Bug Analysis

### Current Behavior (Defect)

**Section 1: API Connection Failures**

1.1 WHEN a user clicks the "Login" button on the login page THEN the frontend attempts to POST to `http://localhost:8001/api/auth/login` which fails with "unable to fetch" error

1.2 WHEN a user clicks the "Sign Up" button on the signup page THEN the frontend attempts to POST to `http://localhost:8001/api/auth/register` which fails with "unable to fetch" error

1.3 WHEN the frontend attempts any authentication-related API call THEN the request is sent to port 8001 instead of the correct port 8000

1.4 WHEN the backend server is running on port 8000 THEN it never receives the authentication requests sent to port 8001

### Expected Behavior (Correct)

**Section 2: Correct API Connection**

2.1 WHEN a user clicks the "Login" button on the login page THEN the frontend SHALL POST to `http://localhost:8000/api/auth/login` and successfully connect to the backend

2.2 WHEN a user clicks the "Sign Up" button on the signup page THEN the frontend SHALL POST to `http://localhost:8000/api/auth/register` and successfully connect to the backend

2.3 WHEN the frontend attempts any authentication-related API call THEN the request SHALL be sent to port 8000 where the backend is listening

2.4 WHEN the backend server is running on port 8000 THEN it SHALL successfully receive and process all authentication requests

2.5 WHEN authentication credentials are valid THEN the login process SHALL complete successfully and redirect the user to the dashboard

2.6 WHEN registration data is valid THEN the signup process SHALL complete successfully and create a new user account

### Unchanged Behavior (Regression Prevention)

**Section 3: Preserve Existing Functionality**

3.1 WHEN the backend server is started THEN the system SHALL CONTINUE TO run on port 8000 as configured in `backend/.env`

3.2 WHEN CORS is configured in the backend THEN the system SHALL CONTINUE TO allow requests from `http://localhost:5173`, `http://localhost:5174`, `http://localhost:5175`, and `http://localhost:3000`

3.3 WHEN the authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`) are called THEN they SHALL CONTINUE TO function with their existing logic unchanged

3.4 WHEN the frontend is in mock mode (`VITE_MOCK_MODE=true`) THEN the system SHALL CONTINUE TO use mock API responses instead of real backend calls

3.5 WHEN the WebSocket connections are established THEN they SHALL CONTINUE TO use the `VITE_WS_URL` configuration for WebSocket endpoints

3.6 WHEN other frontend pages (dashboard, call history, settings) make API calls THEN they SHALL CONTINUE TO use the same corrected API URL

3.7 WHEN users have valid JWT tokens stored THEN the system SHALL CONTINUE TO accept them for authenticated requests

3.8 WHEN password validation and email validation occur THEN they SHALL CONTINUE TO work with existing validation rules

---

## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(request)
  INPUT: request of type APIRequest
  OUTPUT: boolean
  
  // Bug occurs when frontend uses wrong port
  RETURN (request.targetPort = 8001) AND (backend.runningPort = 8000)
END FUNCTION
```

### Counterexample

```
Request: POST http://localhost:8001/api/auth/login
Backend running on: http://localhost:8000
Result: Connection refused, "unable to fetch" error
```

### Property Specification

```pascal
// Property: Fix Checking - Correct Port Connection
FOR ALL request WHERE isBugCondition(request) DO
  correctedRequest ← changePort(request, 8000)
  result ← send(correctedRequest)
  ASSERT result.connected = true AND result.error = null
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT handle(request, oldConfig) = handle(request, newConfig)
END FOR
```

This ensures all non-authentication requests and backend behavior remain unchanged.

---

## Files Affected

### Files to Modify
- `frontend/.env` - Update `VITE_API_URL` from port 8001 to port 8000
- `frontend/.env` - Update `VITE_WS_URL` from port 8001 to port 8000

### Files to Verify (No Changes)
- `backend/.env` - Confirm `PORT=8000` (should remain unchanged)
- `backend/app/main.py` - Confirm server configuration (should remain unchanged)
- `backend/app/routers/auth.py` - Confirm authentication logic (should remain unchanged)
- `frontend/src/services/api.js` - Verify it uses `VITE_API_URL` from environment (no code changes needed)

---

## Validation Criteria

### Fix Verification
1. Frontend environment variables point to port 8000
2. Login button triggers request to `http://localhost:8000/api/auth/login`
3. Signup button triggers request to `http://localhost:8000/api/auth/register`
4. No "unable to fetch" errors appear during authentication
5. Successful login redirects to dashboard
6. Successful signup creates user account

### Regression Testing
1. Backend still runs on port 8000
2. CORS still allows configured origins
3. Authentication endpoints still work correctly
4. WebSocket connections still function
5. Mock mode still works when enabled
6. Other API calls (users, calls, contacts) still work
7. JWT token authentication still functions
8. Password and email validation still work
