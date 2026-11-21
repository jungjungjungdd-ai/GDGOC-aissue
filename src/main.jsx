import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { saveLastReceivedAlert } from './lib/storage.js';

// 알림이 도착하면(앱이 열려 있을 때) 받은 재난문자로 기록
navigator.serviceWorker?.addEventListener('message', (e) => {
  if (e.data?.type === 'alert-received' && e.data.alertId) saveLastReceivedAlert(e.data.alertId);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
