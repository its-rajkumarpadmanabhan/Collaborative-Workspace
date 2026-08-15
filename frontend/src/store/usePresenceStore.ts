import { create } from 'zustand'

export interface PresenceUser {
  id: string
  username: string
  avatar?: string
  color: string
}

export interface CursorPosition {
  x: number
  y: number
  range?: any
}

interface PresenceState {
  users: Record<string, PresenceUser>
  cursors: Record<string, CursorPosition>
  setUsers: (users: Record<string, PresenceUser>) => void
  addUser: (id: string, user: PresenceUser) => void
  removeUser: (id: string) => void
  updateCursor: (id: string, pos: CursorPosition) => void
  removeCursor: (id: string) => void
}

const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa']

export const usePresenceStore = create<PresenceState>((set) => ({
  users: {},
  cursors: {},
  setUsers: (users) => set({ users }),
  addUser: (id, user) => set((state) => {
      if (!user.color) {
          user.color = colors[Object.keys(state.users).length % colors.length]
      }
      return { users: { ...state.users, [id]: user } }
  }),
  removeUser: (id) => set((state) => {
    const newUsers = { ...state.users }
    delete newUsers[id]
    const newCursors = { ...state.cursors }
    delete newCursors[id]
    return { users: newUsers, cursors: newCursors }
  }),
  updateCursor: (id, pos) => set((state) => ({
    cursors: { ...state.cursors, [id]: pos }
  })),
  removeCursor: (id) => set((state) => {
    const newCursors = { ...state.cursors }
    delete newCursors[id]
    return { cursors: newCursors }
  })
}))
