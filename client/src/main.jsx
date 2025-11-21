// import { StrictMode } from 'react' // Disabled to prevent double workflow creation
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // StrictMode disabled - it causes useEffect to run twice in development
  // which creates duplicate workflows. Re-enable for production if needed.
  <App />
)
