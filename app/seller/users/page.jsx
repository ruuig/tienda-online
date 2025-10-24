'use client'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/src/presentation/components/Loading'
import { useAppContext } from '@/context/AppContext'

export default function SellerUsersPage() {
  const { getToken, user } = useAppContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [savingUserId, setSavingUserId] = useState(null)

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
    const prevUsers = users
    // Optimistic UI
    setUsers(prev => prev.map(u => (u._id === targetUserId ? { ...u, role: newRole } : u)))
    setSavingUserId(targetUserId)

    const loadingId = toast.loading('Guardando cambios...')

    const parseJSONorThrow = async (res) => {
      const raw = await res.text()
      try {
        return JSON.parse(raw)
      } catch {
        const snippet = raw.replace(/\s+/g, ' ').slice(0, 160)
        throw new Error(`Respuesta no válida del servidor (HTTP ${res.status}): ${snippet}`)
      }
    }

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

      const data = await parseJSONorThrow(res)
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo asignar el rol')
      }

      toast.dismiss(loadingId)
      toast.success(`Rol actualizado a "${data.role || newRole}"`, { icon: null })

      // Actualiza solo la fila afectada (evita refrescar todo si no quieres)
      setUsers(prev => prev.map(u =>
        u._id === targetUserId ? { ...u, role: data.role || newRole } : u
      ))
    } catch (e) {
      // Rollback + toast de error (sin icono)
      setUsers(prevUsers)
      toast.dismiss(loadingId)
      toast.error(e.message || 'No se pudo asignar el rol', { icon: null })
    } finally {
      setSavingUserId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const matchesText =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u._id || '').toLowerCase().includes(q)
      const role = (u.role || 'user').toLowerCase()
      const matchesRole =
        roleFilter === 'all' || role === roleFilter
      return matchesText && matchesRole
    })
  }, [users, search, roleFilter])

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">
        Error cargando usuarios: {error}
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-secondary-500 border-gray-200"></div>
        </div>
      ) : (
        <div className="w-full p-6">
          
          {/* Buscador + Filtro */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o ID..."
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              >
                <option value="all">Todos los roles</option>
                <option value="seller">Vendedor</option>
                <option value="user">Usuario</option>
              </select>
            </div>
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
                          className={`border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-secondary-500 ${
                            savingUserId === u._id ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={u.role || 'user'}
                          onChange={(e) => setRole(u._id, e.target.value)}
                          disabled={savingUserId === u._id}
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
      )}
    </div>
  )
}

