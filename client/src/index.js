import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Rendre Socket.IO disponible globalement
import io from 'socket.io-client';
window.io = io;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
); 