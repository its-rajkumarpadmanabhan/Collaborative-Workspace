import React, { useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { useCollabSocket } from '../hooks/useCollabSocket'
import { PresenceBar } from './PresenceBar'
import { CursorOverlay } from './CursorOverlay'
import { usePresenceStore } from '../store/usePresenceStore'

export const Editor: React.FC<{ docId: string }> = ({ docId }) => {
    // In a real scenario, this token would be fetched from auth context
    const fakeToken = "dummy_jwt_token_for_demo"
    const { ydoc, sendCursorUpdate, sendDocumentUpdate } = useCollabSocket(docId, fakeToken)
    
    // We are simulating Tiptap collaboration with a custom WebSocket for the architecture spec
    // Typically, we'd use HocuspocusProvider or y-websocket directly. 
    // Here we're using the custom useCollabSocket to satisfy the exact requirements.
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: ydoc,
            }),
            CollaborationCursor.configure({
                provider: {
                    on: () => {}, // mock provider for custom sync
                    awareness: {
                        setLocalStateField: () => {},
                        getStates: () => new Map(),
                        on: () => {},
                    }
                } as any,
                user: {
                    name: 'My User',
                    color: '#f87171'
                }
            })
        ],
        content: `
            <h2>Welcome to Collab Workspace</h2>
            <p>This is a collaborative document.</p>
        `,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none p-8 min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON()
            sendDocumentUpdate(json, 1)
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

    return (
        <div className="flex flex-col h-full bg-zinc-900 w-full relative">
            <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 z-10">
                <h2 className="text-lg font-medium text-white">Document Title</h2>
                <PresenceBar />
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
