import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/format'

interface UserRow {
  id: string
  email: string
  created_at: string
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data as UserRow[])
    } catch {
      try {
        const { data } = await supabase
          .from('wishlists')
          .select('user_id')
          .limit(1)
        if (data && data.length > 0) {
          setUsers([{ id: data[0].user_id, email: '(authenticated user)', created_at: new Date().toISOString() }])
        }
      } catch (e) {
        console.error('Failed to load users:', e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Users</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="p-8 text-center text-neutral-400">Memuat...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={2} className="p-8 text-center text-neutral-400">Belum ada user terdaftar</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 font-medium text-neutral-900">{u.email}</td>
                  <td className="p-3 text-neutral-600">{formatDate(u.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
