import React, { useState } from 'react'
import { Editor } from './components/Editor'

function App() {
  const [docId, setDocId] = useState('demo-doc-12345')

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Collab Workspace</h1>
        <div className="text-sm text-zinc-400">Doc ID: {docId}</div>
      </header>
      <main className="flex-1 overflow-auto flex justify-center p-8">
        <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 shadow-xl rounded-xl overflow-hidden flex flex-col">
           <Editor docId={docId} />
        </div>
      </main>
    </div>
  )
}

export default App
