import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { H3Framework } from '@hut-3-enigma-studio/h3-framework'
import '@hut-3-enigma-studio/h3-framework/styles'
import App from './App.tsx'

// H3Framework supplies the design system (styles, dialogs, theme).
// Login stays in App/Login/Register, so authUrl is unused here.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <H3Framework authUrl="" domain="localhost">
      <App />
    </H3Framework>
  </StrictMode>,
)
