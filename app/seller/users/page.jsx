'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Loading from '@/src/presentation/components/Loading'
import { useAppContext } from '@/context/AppContext'

export default function SellerUsersPage() {
  const { getToken, user } = useAppContext()

  // Verificar que el usuario sea admin o seller (solo estos roles pueden gestionar usuarios)
  if (!user || (user.publicMetadata?.role !== 'admin' && user.publicMetadata?.role !== 'seller')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Solo los administradores y vendedores pueden acceder a esta página.</p>
          <p className="text-sm text-gray-500 mt-2">Tu rol actual: {user?.publicMetadata?.role || 'user'}</p>
        </div>
      </div>
    )
  }
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
      const token = await getToken()
      const res = await fetch(`/api/admin/users/set-role/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    return <Loading />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">
        Error cargando usuarios: {error}
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <div className="w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios y sus roles (Solo para administradores y vendedores)</p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Información sobre roles
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Los roles que se pueden asignar son:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>Usuario:</strong> Acceso básico a la tienda</li>
                    <li><strong>Vendedor:</strong> Puede gestionar productos y usuarios</li>
                  </ul>
                  <p className="mt-2 text-xs">Los roles de administrador solo se pueden asignar desde el dashboard de Clerk por seguridad.</p>
                </div>
              </div>
            </div>
          </div>
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
                        <option value="user">Usuario</option>
                        <option value="seller">Vendedor</option>
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
    </div>
  )
}
