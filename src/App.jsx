import { Tldraw, createTLStore, loadSnapshot, getSnapshot } from 'tldraw'
import { getAssetUrlsByImport } from '@tldraw/assets/imports.vite'
import 'tldraw/tldraw.css'
import { useLayoutEffect, useMemo, useState } from 'react'
import { throttle } from './utils'

const assetUrls = getAssetUrlsByImport()
const DOCUMENT_ID = 'default'
const API_URL = import.meta.env.VITE_API_URL || ''

export default function App() {
  const store = useMemo(() => createTLStore(), [])
  const [loadingState, setLoadingState] = useState({ status: 'loading' })

  useLayoutEffect(() => {
    // Load snapshot from backend
    const loadFromBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/document/${DOCUMENT_ID}`)

        if (response.ok) {
          const data = await response.json()
          loadSnapshot(store, data.snapshot)
        }

        setLoadingState({ status: 'ready' })
      } catch (error) {
        console.error('Failed to load document:', error)
        setLoadingState({ status: 'ready' })
      }
    }

    loadFromBackend()

    // Save to backend on changes (throttled)
    const saveToBackend = throttle(async () => {
      try {
        const snapshot = getSnapshot(store)
        await fetch(`${API_URL}/api/document/${DOCUMENT_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot })
        })
      } catch (error) {
        console.error('Failed to save document:', error)
      }
    }, 1000)

    const cleanupFn = store.listen(saveToBackend, { source: 'user', scope: 'document' })

    return () => {
      cleanupFn()
      saveToBackend.cancel()
    }
  }, [store])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {loadingState.status === 'loading' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          Loading...
        </div>
      ) : (
        <Tldraw assetUrls={assetUrls} store={store} />
      )}
    </div>
  )
}
