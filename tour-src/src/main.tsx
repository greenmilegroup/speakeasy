import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/limelight/index.css'
import './ui/ui.css'
import App from './App'
import { WebGLFallback } from './ui/WebGLFallback'

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{webglSupported() ? <App /> : <WebGLFallback />}</StrictMode>,
)
