import React from 'react';
import ReactDOM from 'react-dom/client';

import '@/src/assets/styles/globals.css';
import { AuthGate } from '@/src/popup/components/AuthGate';
import App from './App.tsx';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* AuthGate bắt buộc — không có thì popup không hiện LoginScreen, OAuth không thể dùng */}
    <AuthGate>
      <App />
    </AuthGate>
  </React.StrictMode>,
);
