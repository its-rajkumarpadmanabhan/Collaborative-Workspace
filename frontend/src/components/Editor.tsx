import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import 'highlight.js/styles/atom-one-dark.css' // VS Code-like rainbow theme
import { useCollabSocket } from '../hooks/useCollabSocket'
import { PresenceBar } from './PresenceBar'
import { CursorOverlay } from './CursorOverlay'
import { useAuth, api } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const lowlight = createLowlight(all)

export const Editor: React.FC<{ docId: string, onTitleChange?: (title: string) => void }> = ({ docId, onTitleChange }) => {
    const { token, user } = useAuth()
    const { ydoc, sendCursorUpdate, sendDocumentUpdate } = useCollabSocket(docId, token || '')
    const [workspace, setWorkspace] = useState<any>(null)
    const [inviteUsername, setInviteUsername] = useState('')

    useEffect(() => {
        // Fetch workspace details to check permissions/mode
        api.get(`workspaces/${docId}/`).then(res => setWorkspace(res.data)).catch(console.error)
    }, [docId])

    const handleInvite = async () => {
        if (!inviteUsername) return
        try {
            await api.post(`workspaces/${docId}/invite/`, { username: inviteUsername })
            toast.success(`Invite sent to ${inviteUsername}!`)
            setInviteUsername('')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send invite')
        }
    }
    
    // We are simulating Tiptap collaboration with a custom WebSocket for the architecture spec
    // Typically, we'd use HocuspocusProvider or y-websocket directly. 
    // Here we're using the custom useCollabSocket to satisfy the exact requirements.
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Disable default codeBlock to use lowlight
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Collaboration.configure({
                document: ydoc,
            }),
            // CollaborationCursor.configure({
            //     provider: {
            //         on: () => {}, // mock provider for custom sync
            //         awareness: {
            //             setLocalStateField: () => {},
            //             getStates: () => new Map(),
            //             on: () => {},
            //         }
            //     } as any,
            //     user: {
            //         name: 'My User',
            //         color: '#f87171'
            //     }
            // })
        ],
        content: `
            <h2>Welcome to Collab Workspace</h2>
            <p>This is a collaborative document.</p>
        `,
        editorProps: {
            attributes: {
                class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none p-8 min-h-[500px] transition-colors',
            },
        }
    })

    const editorRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!editorRef.current) return
        const rect = editorRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Throttle using requestAnimationFrame for smooth cursor sync
        requestAnimationFrame(() => {
            sendCursorUpdate({ x, y })
        })
    }, [sendCursorUpdate])

    const ytitle = ydoc.getText('title')
    const [title, setTitle] = React.useState(ytitle.toString() || 'Untitled Document')

    React.useEffect(() => {
        const updateTitle = () => {
            const currentTitle = ytitle.toString() || 'Untitled Document'
            setTitle(currentTitle)
            if (onTitleChange) onTitleChange(currentTitle)
        }
        updateTitle() // Initialize title on mount
        ytitle.observe(updateTitle)
        return () => ytitle.unobserve(updateTitle)
    }, [ytitle, onTitleChange])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        ydoc.transact(() => {
            ytitle.delete(0, ytitle.length)
            ytitle.insert(0, newTitle)
        })
    }

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
        a.download = `${title || 'Untitled_Document'}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        // Reset the select dropdown
        e.target.value = ""
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 w-full relative transition-colors">
            <div className="border-b border-gray-200 dark:border-zinc-800 p-4 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 z-10 transition-colors">
                <input 
                    value={title}
                    onChange={handleTitleChange}
                    className="text-lg font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-zinc-700 rounded px-2 py-1 transition-colors"
                    placeholder="Untitled Document"
                />
                <div className="flex items-center space-x-4">
                    <select 
                        onChange={handleDownload} 
                        className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded px-2 py-1 text-sm outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                        defaultValue=""
                    >
                        <option value="" disabled>Download as...</option>
                        <option value="txt">.txt (Text)</option>
                        <option value="html">.html (HTML)</option>
                        <option value="md">.md (Markdown)</option>
                        <option value="json">.json (JSON)</option>
                        <option disabled>--- Scripts ---</option>
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
                    {workspace?.mode === 'room' && workspace?.owner?.id === user?.id && (
                        <div className="flex items-center space-x-2">
                            <input 
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                                placeholder="Username to invite..."
                                className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded px-2 py-1 text-sm outline-none w-36"
                            />
                            <button onClick={handleInvite} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                Invite
                            </button>
                        </div>
                    )}
                    <PresenceBar />
                </div>
            </div>
            <div 
                className="flex-1 overflow-y-auto relative cursor-text"
                ref={editorRef}
                onMouseMove={handleMouseMove}
            >
                <EditorContent editor={editor} />
                <CursorOverlay containerRef={editorRef} />
            </div>
        </div>
    )
}
