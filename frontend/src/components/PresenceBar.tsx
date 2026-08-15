import React from 'react'
import { usePresenceStore } from '../store/usePresenceStore'

export const PresenceBar: React.FC = () => {
    const users = usePresenceStore(s => s.users)
    const userList = Object.values(users)

    return (
        <div className="flex items-center space-x-2">
            {userList.map(user => (
                <div 
                    key={user.id} 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-zinc-900"
                    style={{ backgroundColor: user.color }}
                    title={user.username}
                >
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full" />
                    ) : (
                        user.username.charAt(0).toUpperCase()
                    )}
                </div>
            ))}
            {userList.length === 0 && (
                <div className="text-zinc-500 text-sm">No one else is here</div>
            )}
        </div>
    )
}
