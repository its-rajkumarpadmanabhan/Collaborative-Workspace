import { useEffect, useRef, useState } from 'react'
import { usePresenceStore } from '../store/usePresenceStore'
import * as Y from 'yjs'

export const useCollabSocket = (docId: string, token: string) => {
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)
    const ydocRef = useRef<Y.Doc>(new Y.Doc())
    
    const addUser = usePresenceStore(s => s.addUser)
    const removeUser = usePresenceStore(s => s.removeUser)
    const updateCursor = usePresenceStore(s => s.updateCursor)

    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
        const socket = new WebSocket(`${wsUrl}/ws/documents/${docId}/?token=${token}`)
        
        socket.onopen = () => {
            setIsConnected(true)
            console.log('WebSocket Connected')
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
                case 'presence_update':
                    if (data.action === 'join') {
                        addUser(data.user_id, {
                            id: data.user_id,
                            username: data.username,
                            avatar: data.avatar,
                            color: '' // color assigned in store
                        })
                    } else if (data.action === 'leave') {
                        removeUser(data.user_id)
                    }
                    break
                case 'cursor_update':
                    updateCursor(data.user_id, data.position)
                    break
                case 'document_update':
                    // Apply document update to ydoc if needed, 
                    // though typically with Tiptap Y.js we'd use a real Y.js provider like y-websocket.
                    // This is a customized approach per spec.
                    break
                default:
                    break
            }
        }

        socket.onclose = () => {
            setIsConnected(false)
            console.log('WebSocket Disconnected')
        }

        socketRef.current = socket

        return () => {
            socket.close()
        }
    }, [docId, token, addUser, removeUser, updateCursor])

    const sendCursorUpdate = (position: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'cursor_update',
                position
            }))
        }
    }

    const sendDocumentUpdate = (content: any, version: number) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'document_update',
                content,
                version
            }))
        }
    }

    return {
        isConnected,
        ydoc: ydocRef.current,
        sendCursorUpdate,
        sendDocumentUpdate
    }
}
