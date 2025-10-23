'use client'
import React, { useEffect, useMemo, useState } from 'react'

export default function SellerUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/list', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo obtener usuarios')
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const setRole = async (targetUserId, newRole) => {
    // Optimistic UI
    const prev = users
    setUsers(prev =>
      prev.map(u => (u._id === targetUserId ? { ...u, role: newRole } : u))
    )

    try {
      const res = await fetch(`/api/admin/users/set-role/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo asignar el rol')
      // Re-sync con backend por si hubo cambios colaterales
      await refresh()
    } catch (e) {
      alert(e.message)
      // Rollback si falló
      setUsers(prev)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u._id || '').toLowerCase().includes(q)
    )
  }, [users, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">
        Error cargando usuarios: {error}
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-600">Usuarios registrados en la plataforma</p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o ID..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                {/* Usuario */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {(u.name || '?').split(' ').map(n => n[0]).join('').slice(0,2)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{u.name || '—'}</div>
                      <div className="text-sm text-gray-500">{u.imageUrl ? 'Con avatar' : 'Sin avatar'}</div>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>

                {/* Rol (badge + selector) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (u.role || 'user') === 'seller'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>

                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      value={u.role || 'user'}
                      onChange={(e) => setRole(u._id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="seller">seller</option>
                    </select>
                  </div>
                </td>

                {/* ID */}
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">{u._id}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
