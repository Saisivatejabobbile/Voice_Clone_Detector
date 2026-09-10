import { createContext, useContext } from 'react';
import { useSimplePeerCall } from './useSimplePeerCall';

const SimplePeerCallContext = createContext(null);

export function SimplePeerCallProvider({ children }) {
  const callState = useSimplePeerCall();
  
  return (
    <SimplePeerCallContext.Provider value={callState}>
      {children}
    </SimplePeerCallContext.Provider>
  );
}

export function useSharedSimplePeerCall() {
  const context = useContext(SimplePeerCallContext);
  if (!context) {
    throw new Error('useSharedSimplePeerCall must be used within SimplePeerCallProvider');
  }
  return context;
}
