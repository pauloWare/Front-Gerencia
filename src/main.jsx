import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; 
import './theme.css';
import RotasApp from './rotas.jsx';
import { RoleProvider } from './lib/useRole.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <RotasApp />
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>
);
