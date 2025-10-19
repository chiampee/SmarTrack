import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { linkService } from './services/linkService';
import { AuthProvider } from './contexts/AuthContext';

console.log('🚀 Smart Research Tracker starting...');

// Expose linkService to window for testing
(window as any).linkService = linkService;
console.log('🔧 linkService exposed to window for testing');

// Simple error handling
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

// Simple app initialization
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
  console.log('✅ App rendered successfully');
} else {
  console.error('❌ Root element not found');
}

// Listen for extension broadcasts and refresh link list immediately
try {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event?.data?.type === 'SRT_DB_UPDATED') {
      import('./stores/linkStore').then(({ useLinkStore }) => {
        useLinkStore.getState().fetchLinks();
      });
    }
  });
  document.addEventListener('srt-db-updated', () => {
    import('./stores/linkStore').then(({ useLinkStore }) => {
      useLinkStore.getState().fetchLinks();
    });
  });
} catch (_) {
  // ignore
}
