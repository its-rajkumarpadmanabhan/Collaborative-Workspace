import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const UserSettings: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('users/me/', { email, avatar })
      toast.success('Profile updated successfully! (Please re-login to see changes globally)')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you ABSOLUTELY sure? This will delete your account and ALL your workspaces permanently. This action cannot be undone.")
    if (!confirm) return
    
    try {
      await api.delete('users/me/')
      toast.success('Account deleted permanently.')
      logout()
    } catch (err) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8 transition-colors">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <button onClick={() => navigate('/')} className="text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-200 dark:border-zinc-800 p-8 mb-8 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Username (Immutable)</label>
              <input type="text" disabled value={user?.username || ''} className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-gray-500 dark:text-zinc-500 cursor-not-allowed" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Avatar URL</label>
              <input 
                type="url" 
                value={avatar} 
                onChange={e => setAvatar(e.target.value)} 
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              />
              {avatar && (
                <div className="mt-4 flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Preview:</span>
                  <img src={avatar} alt="Avatar preview" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 p-8 transition-colors">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-red-500 dark:text-red-300/70 text-sm mb-6">
            Deleting your account will permanently remove all your data, including any workspaces and documents you own. This cannot be undone.
          </p>
          <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm">
            Delete Account Permanently
          </button>
        </div>
      </div>
    </div>
  )
}
