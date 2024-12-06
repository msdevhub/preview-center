import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import VConsole from 'vconsole'

// 初始化虚拟控制台
new VConsole()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
