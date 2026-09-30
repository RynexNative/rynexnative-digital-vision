import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reloadForNewVersion } from './lib/lazy-with-reload'

// Vite fires this when a page file from an older deploy no longer exists
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

createRoot(document.getElementById("root")!).render(<App />);
