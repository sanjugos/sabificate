import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth/useAuth';
import { SyncProvider } from './lib/sync/SyncContext';
import './app/main.css';
import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  </StrictMode>,
);
