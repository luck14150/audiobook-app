import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import { useChatStore } from './stores'
import './index.css'

function Root() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    try {
      useChatStore.getState().initialize()
    } catch {
      // 忽略
    }
    if (mounted) setReady(true)
    return () => {
      mounted = false
    }
  }, [])

  if (!ready) {
    return (
      <div
        style={{
          height: '100vh',
          background: '#eef2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(99,102,241,0.35)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'root-spin 0.8s linear infinite',
          }}
        />
        <div style={{ marginTop: 12, color: '#475569', fontSize: 13 }}>DataMind AI 正在加载...</div>
        <style>{`@keyframes root-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const router = createHashRouter(
    [
      {
        path: '/*',
        element: <App />,
      },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      } as any,
    }
  )

  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
