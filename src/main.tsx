import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

console.log('🚀 Smart Research Tracker starting...');

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
      <App />
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
