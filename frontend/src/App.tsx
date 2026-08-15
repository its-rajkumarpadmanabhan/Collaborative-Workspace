import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Editor } from './components/Editor'
import { AuthFlow } from './components/AuthFlow'
import { Dashboard } from './components/Dashboard'
import { UserProfile } from './components/UserProfile'
import { UserSettings } from './components/UserSettings'
import { PublicDocumentViewer } from './components/PublicDocumentViewer'
import { useAuth } from './contexts/AuthContext'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
         <button 
           onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
           className="bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 px-4 py-1 rounded-full text-sm font-medium shadow"
         >
           Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
         </button>
      </div>
      <Routes>
        <Route path="/login" element={<AuthFlow />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doc/:docId" 
          element={
            <ProtectedRoute>
              <DocumentWorkspace />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:username" 
          element={<UserProfile />} 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <UserSettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/public/:docId" 
          element={<PublicDocumentViewer />} 
        />
      </Routes>
    </div>
  )
}

function DocumentWorkspace() {
  const { docId } = useParams<{ docId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docTitle, setDocTitle] = useState('Loading...')

  if (!docId) return null

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Collab Workspace</h1>
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded transition-colors">
            Dashboard
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 dark:text-zinc-300 hidden md:block">Hello, {user?.username}</span>
          <button onClick={() => navigate(`/profile/${user?.username}`)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
            My Profile
          </button>
          <div className="text-sm text-gray-500 dark:text-zinc-400 hidden lg:block">Doc ID: {docId}</div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard!');
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition"
          >
            Copy Share Link
          </button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full p-4 gap-4">
        <div className="w-64 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 hidden md:block transition-colors">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Workspace</h2>
          <div className="text-gray-700 dark:text-zinc-300 text-sm">
            You are editing document: <br/>
            <strong className="mt-1 block text-gray-900 dark:text-white text-lg">{docTitle}</strong>
            <code className="text-xs bg-gray-100 dark:bg-zinc-800 p-1 rounded mt-2 block break-all text-gray-500 dark:text-zinc-500 transition-colors">{docId}</code>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xl transition-colors">
          <Editor docId={docId} onTitleChange={setDocTitle} />
        </div>
      </main>
    </div>
  )
}

export default App
