import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reloadForNewVersion } from './lib/lazy-with-reload'

// Vite fires this when a page file from an older deploy no longer exists
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

// The site used to put pages after a "#" (/#/news/x). Turn those links into real
// paths before the router starts; other anchors (#contact) are dropped so the page
// does not jump on load.
const { hash, pathname, search } = window.location
if (hash.startsWith('#/')) {
  window.history.replaceState(null, '', hash.slice(1))
} else if (hash) {
  window.history.replaceState(null, '', pathname + search)
}

createRoot(document.getElementById("root")!).render(<App />);
