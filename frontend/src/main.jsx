import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Debug logging
console.log('🚀 App starting...');
console.log('Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('✅ Root element found, rendering app...');
  
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ App failed to render:', error);
  
  // Show error message on screen
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
        <h1>🚨 App Failed to Load</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Environment Variables:</strong></p>
        <ul>
          <li>VITE_API_URL: ${import.meta.env.VITE_API_URL || 'NOT SET'}</li>
          <li>VITE_SOCKET_URL: ${import.meta.env.VITE_SOCKET_URL || 'NOT SET'}</li>
          <li>VITE_APP_NAME: ${import.meta.env.VITE_APP_NAME || 'NOT SET'}</li>
          <li>VITE_APP_VERSION: ${import.meta.env.VITE_APP_VERSION || 'NOT SET'}</li>
        </ul>
        <p>Check browser console for more details.</p>
      </div>
    `;
  }
}
