import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { RsvpProvider } from './contexts/RsvpContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RsvpProvider>
      <App />
    </RsvpProvider>
  </StrictMode>
);
