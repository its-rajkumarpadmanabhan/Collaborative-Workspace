import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [invites, setInvites] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    fetchInvites()
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('workspaces/')
      setWorkspaces(response.data)
    } catch (err) {
      console.error('Failed to fetch workspaces', err)
    }
  }

  const fetchInvites = async () => {
    try {
      const response = await api.get('invites/')
      setInvites(response.data)
    } catch (err) {
      console.error('Failed to fetch invites', err)
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await api.post(`invites/${inviteId}/accept/`)
      toast.success('Joined room successfully!')
      fetchInvites()
      fetchWorkspaces()
    } catch (err) {
      toast.error('Failed to accept invite')
    }
  }

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await api.post(`invites/${inviteId}/decline/`)
      toast.success('Invite declined')
      fetchInvites()
    } catch (err) {
      toast.error('Failed to decline invite')
    }
  }

  const handleCreateDocument = async (mode: 'individual' | 'room') => {
    try {
      const response = await api.post('workspaces/', {
        name: `${user?.username}'s ${mode === 'individual' ? 'Document' : 'Room'}`,
        mode: mode,
        is_public: isPublic
      })
      navigate(`/doc/${response.data.id}`)
    } catch (err) {
      toast.error('Failed to create workspace')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-8 transition-colors">
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        <span className="text-gray-700 dark:text-zinc-300 font-medium">Hello, {user?.username}</span>
        <button onClick={() => navigate(`/profile/${user?.username}`)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
          My Profile
        </button>
        <button onClick={() => navigate(`/settings`)} className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors">
          Settings
        </button>
        <button onClick={logout} className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors">
          Logout
        </button>
      </div>

      <div className="mb-6 flex items-center justify-center space-x-2">
        <input 
          type="checkbox" 
          id="isPublic" 
          checked={isPublic} 
          onChange={(e) => setIsPublic(e.target.checked)} 
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
        />
        <label htmlFor="isPublic" className="text-sm font-medium text-gray-900 dark:text-gray-300">
          Make new workspaces Public (visible on your profile)
        </label>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Individual Box */}
        <div 
          onClick={() => handleCreateDocument('individual')}
          className="bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-blue-500 rounded-xl p-8 shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Individual</h2>
          <p className="text-gray-500 dark:text-zinc-400">Create a private document. Only you can view and edit.</p>
        </div>

        {/* Room Box */}
        <div 
          onClick={() => handleCreateDocument('room')}
          className="bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-purple-500 rounded-xl p-8 shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Room</h2>
          <p className="text-gray-500 dark:text-zinc-400">Create a collaborative room. Invite users by username to sync typing.</p>
        </div>
      </div>

      {/* Inbox Panel */}
      <div className="max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6 transition-colors">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2">Your Inbox (Invites)</h3>
        {invites.length === 0 ? (
          <p className="text-gray-500 dark:text-zinc-400 italic">No pending invites.</p>
        ) : (
          <div className="space-y-4">
            {invites.map(invite => (
              <div key={invite.id} className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 transition-colors">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{invite.sender.username} invited you to join:</div>
                  <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{invite.workspace.name} (Room)</div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleAcceptInvite(invite.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">Accept</button>
                  <button onClick={() => handleDeclineInvite(invite.id)} className="bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400 dark:hover:bg-zinc-600 text-gray-800 dark:text-zinc-200 px-4 py-1.5 rounded text-sm font-medium transition-colors">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Workspaces Panel */}
      <div className="max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6 mt-8 transition-colors">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2">Your Workspaces</h3>
        {workspaces.length === 0 ? (
          <p className="text-gray-500 dark:text-zinc-400 italic">You don't have any workspaces yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaces.map(ws => (
              <div 
                key={ws.id} 
                onClick={() => navigate(`/doc/${ws.id}`)}
                className="flex items-center justify-between bg-gray-50 dark:bg-zinc-950 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
              >
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {ws.name}
                    {ws.mode === 'room' ? (
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">Room</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">Individual</span>
                    )}
                    {ws.is_public && (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-0.5 rounded-full ml-1">Public</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    Owner: {ws.owner.username === user?.username ? 'You' : ws.owner.username}
                  </div>
                </div>
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
