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
                    if (data.action === 'join' || data.action === 'sync') {
                        addUser(data.user_id, {
                            id: data.user_id,
                            username: data.username,
                            avatar: data.avatar,
                            color: '' // color assigned in store
                        })
                        
                        if (data.action === 'join') {
                            // When a new user joins, broadcast our own presence back to them!
                            if (socketRef.current?.readyState === WebSocket.OPEN) {
                                socketRef.current.send(JSON.stringify({
                                    type: 'presence_sync'
                                }))
                                
                                // Also broadcast our full state to them for initial sync
                                const fullState = Y.encodeStateAsUpdate(ydocRef.current)
                                socketRef.current.send(JSON.stringify({
                                    type: 'document_update',
                                    update: Array.from(fullState),
                                    version: 1
                                }))
                            }
                        }
                    } else if (data.action === 'leave') {
                        removeUser(data.user_id)
                    }
                    break
                case 'cursor_update':
                    updateCursor(data.user_id, data.position)
                    break
                case 'initial_state':
                    // Load the document from the database on connection
                    if (data.update && data.update.length > 0) {
                        Y.applyUpdate(ydocRef.current, new Uint8Array(data.update), 'websocket')
                    }
                    break
                case 'document_update':
                    // Apply incoming Yjs update
                    if (data.update) {
                        Y.applyUpdate(ydocRef.current, new Uint8Array(data.update), 'websocket')
                    }
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

        // Listen for local changes to the Yjs document and broadcast them
        const handleUpdate = (update: Uint8Array, origin: any) => {
            // Only broadcast local changes
            if (origin !== 'websocket' && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'document_update',
                    update: Array.from(update),
                    version: 1
                }))
            }
        }

        ydocRef.current.on('update', handleUpdate)

        // Periodically save the full document state to the database
        const saveInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                const fullState = Y.encodeStateAsUpdate(ydocRef.current)
                socket.send(JSON.stringify({
                    type: 'save_state',
                    update: Array.from(fullState)
                }))
            }
        }, 5000)

        return () => {
            clearInterval(saveInterval)
            ydocRef.current.off('update', handleUpdate)
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
