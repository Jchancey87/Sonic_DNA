import React, { createContext, useContext, useMemo } from 'react';
import { HttpBackendAdapter } from '../adapters/HttpBackendAdapter.js';

const BackendContext = createContext(null);

export const BackendProvider = ({ children, adapter }) => {
  // Use provided adapter or fall back to default production adapter
  const backend = useMemo(() => {
    return adapter || new HttpBackendAdapter(process.env.REACT_APP_API_URL);
  }, [adapter]);

  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
