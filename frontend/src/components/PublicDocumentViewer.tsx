import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import * as Y from 'yjs'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'

const lowlight = createLowlight(all)

export const PublicDocumentViewer: React.FC = () => {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const [docInfo, setDocInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Create a local Y.Doc for rendering the read-only view
  const [ydoc] = useState(() => new Y.Doc())

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await api.get(`public-documents/${docId}/`)
        setDocInfo(response.data)
        
        // Apply the raw Yjs update array from the DB to our local read-only ydoc
        if (response.data.content && response.data.content.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(response.data.content), 'init')
        }
      } catch (err) {
        toast.error('Document not found or is not public')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [docId, navigate, ydoc])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Collaboration.configure({ document: ydoc }),
    ],
    editable: false, // strictly read-only for public viewers
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none p-8 min-h-[500px] transition-colors cursor-default',
      },
    }
  })

  const handleDownload = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value
    if (!format || !editor) return
    
    let content = ''
    let mimeType = 'text/plain'

    if (format === 'html') {
        content = editor.getHTML()
        mimeType = 'text/html'
    } else if (format === 'json') {
        content = JSON.stringify(editor.getJSON(), null, 2)
        mimeType = 'application/json'
    } else {
        content = editor.getText()
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docInfo?.title || 'Public_Document'}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    e.target.value = ""
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-gray-500 dark:text-zinc-400">Loading public document...</div>
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-950 transition-colors p-4 md:p-8">
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-colors max-w-6xl mx-auto w-full">
        <div className="border-b border-gray-200 dark:border-zinc-800 p-4 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 z-10 transition-colors">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {docInfo?.title || 'Untitled Document'}
            </h1>
            <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
              Read-Only
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              onChange={handleDownload} 
              className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors font-medium shadow-sm"
              defaultValue=""
            >
              <option value="" disabled>Download Document...</option>
              <option value="txt">.txt (Text)</option>
              <option value="html">.html (HTML)</option>
              <option value="md">.md (Markdown)</option>
              <option value="json">.json (JSON)</option>
              <option disabled>--- Source Code ---</option>
              <option value="py">.py (Python)</option>
              <option value="js">.js (JavaScript)</option>
              <option value="ts">.ts (TypeScript)</option>
              <option value="java">.java (Java)</option>
              <option value="c">.c (C)</option>
              <option value="cpp">.cpp (C++)</option>
              <option value="go">.go (Go)</option>
              <option value="rs">.rs (Rust)</option>
              <option value="sql">.sql (SQL)</option>
            </select>
            <button onClick={() => navigate(-1)} className="text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 px-4 py-1.5 rounded-lg font-medium transition-colors shadow-sm">
              Go Back
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
