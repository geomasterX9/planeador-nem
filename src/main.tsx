import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. Importamos el proveedor de Google
import { GoogleOAuthProvider } from '@react-oauth/google'

// 2. Reemplaza esto con tu ID real de Google Cloud
const GOOGLE_CLIENT_ID = "77099002011-s8ek3lmkchak77m1dpk5tockb3rh3a5t.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Envolvemos toda la aplicación */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)