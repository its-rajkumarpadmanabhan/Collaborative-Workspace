import React from 'react'
import { usePresenceStore } from '../store/usePresenceStore'

interface Props {
    containerRef: React.RefObject<HTMLDivElement | null>
}

export const CursorOverlay: React.FC<Props> = ({ containerRef }) => {
    const cursors = usePresenceStore(s => s.cursors)
    const users = usePresenceStore(s => s.users)

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-20">
            {Object.entries(cursors).map(([userId, pos]) => {
                const user = users[userId]
                if (!user) return null

                return (
                    <div 
                        key={userId}
                        className="absolute flex flex-col items-start transition-all duration-75"
                        style={{ 
                            transform: `translate(${pos.x}px, ${pos.y}px)`,
                        }}
                    >
                        <svg
                            width="24"
                            height="36"
                            viewBox="0 0 24 36"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-md"
                        >
                            <path
                                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                                fill={user.color}
                            />
                        </svg>
                        <div 
                            className="px-2 py-1 rounded text-white text-xs whitespace-nowrap mt-1 ml-4"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.username}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
