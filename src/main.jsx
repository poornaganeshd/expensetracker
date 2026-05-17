import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initOfflineSync } from './offlineSync'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      // statechange reload removed — controllerchange below handles the single
      // reload after clients.claim(). Having both caused a double-reload chain:
      // statechange reloads → fresh page → controllerchange fires again → second reload.
    }).catch(() => {})
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    })
  })
}

initOfflineSync()

createRoot(document.getElementById('root')).render(
  <App />
)
