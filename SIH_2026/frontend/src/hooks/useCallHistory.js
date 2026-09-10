// Custom hook for managing call history with API integration
import { useState, useEffect, useCallback } from 'react';
import { callsAPI } from '../services/api';

export const useCallHistory = (limit = 50, offset = 0) => {
  const [calls, setCalls] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch call history from API
  const fetchCallHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await callsAPI.getCallHistory(limit, offset);
      
      // FIXED: Handle both array and object responses
      if (Array.isArray(response)) {
        // Real API returns array directly
        console.log('[Call History] Received array response:', response.length, 'calls');
        console.log('[Call History] First call:', response[0]);
        setCalls(response);
        setTotal(response.length);
      } else {
        // Mock mode returns {calls: [...], total: ...}
        console.log('[Call History] Received object response:', response);
        setCalls(response.calls || []);
        setTotal(response.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch call history');
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  // Get call session details
  const getCallSession = useCallback(async (callId) => {
    try {
      const call = await callsAPI.getCallSession(callId);
      return { success: true, call };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get calls by risk level
  const getCallsByRiskLevel = useCallback((riskLevel) => {
    if (riskLevel === 'ALL') return calls;
    return calls.filter(call => call.risk_level === riskLevel);
  }, [calls]);

  // Get risk counts
  const getRiskCounts = useCallback(() => {
    return {
      LOW: calls.filter(c => c.risk_level === 'LOW').length,
      MEDIUM: calls.filter(c => c.risk_level === 'MEDIUM').length,
      HIGH: calls.filter(c => c.risk_level === 'HIGH').length,
    };
  }, [calls]);

  // Initial fetch
  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  return {
    calls,
    total,
    loading,
    error,
    fetchCallHistory,
    getCallSession,
    getCallsByRiskLevel,
    getRiskCounts,
  };
};