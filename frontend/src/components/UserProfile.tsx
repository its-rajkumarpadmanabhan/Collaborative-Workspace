import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`profile/${username}/`)
        setProfile(response.data)
      } catch (err) {
        toast.error('User not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username, navigate])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-gray-500 dark:text-zinc-400">Loading profile...</div>
  }

  if (!profile) return null

  const isOwnProfile = user?.username === profile.username

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-200 dark:border-zinc-800 p-8 mb-8 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-4xl font-bold uppercase overflow-hidden border-4 border-white dark:border-zinc-800 shadow-md">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.username.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
              <p className="text-gray-500 dark:text-zinc-400 mt-1">
                {profile.public_workspaces.length} Public {profile.public_workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button onClick={() => navigate('/')} className="text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">
              Back to Dashboard
            </button>
            {isOwnProfile && (
              <button onClick={() => navigate('/settings')} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Public Repositories */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-zinc-800 pb-2">Public Workspaces</h2>
        
        {profile.public_workspaces.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-12 text-center transition-colors">
            <p className="text-gray-500 dark:text-zinc-400 italic">This user has no public workspaces.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.public_workspaces.map((ws: any) => (
              <div 
                key={ws.id} 
                onClick={() => navigate(`/public/${ws.id}`)}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-blue-500 rounded-xl p-6 shadow-sm cursor-pointer transform hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                    {ws.name}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                    Public
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-zinc-400 mt-4 space-x-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
                    {ws.mode === 'room' ? 'Room' : 'Document'}
                  </div>
                  <div>
                    Updated {new Date(ws.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
