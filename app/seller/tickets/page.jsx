'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '@/context/AppContext'
import Loading from '@/src/presentation/components/Loading'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'waiting_user', label: 'Esperando usuario' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'closed', label: 'Cerrados' },
  { value: 'escalated', label: 'Escalados' }
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'technical', label: 'Soporte técnico' },
  { value: 'billing', label: 'Facturación' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'account', label: 'Cuenta' },
  { value: 'products', label: 'Productos' },
  { value: 'shipping', label: 'Envíos' },
  { value: 'returns', label: 'Devoluciones' },
  { value: 'other', label: 'Otros' }
]

const STATUS_LABELS = {
  open: 'Abierto',
  in_progress: 'En progreso',
  waiting_user: 'Esperando usuario',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  escalated: 'Escalado'
}

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
}

const SENDER_LABELS = {
  user: 'Cliente',
  admin: 'Agente',
  bot: 'Asistente',
  system: 'Sistema'
}

const senderColors = {
  user: 'border-blue-200 bg-blue-50',
  admin: 'border-emerald-200 bg-emerald-50',
  bot: 'border-violet-200 bg-violet-50',
  system: 'border-gray-200 bg-gray-100'
}

const senderBadgeColors = {
  user: 'bg-blue-100 text-blue-700 border-blue-200',
  admin: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bot: 'bg-violet-100 text-violet-700 border-violet-200',
  system: 'bg-gray-100 text-gray-700 border-gray-200'
}

const statusBadgeClass = {
  open: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-sky-100 text-sky-700',
  waiting_user: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-200 text-gray-700',
  escalated: 'bg-rose-100 text-rose-700'
}

const priorityBadgeClass = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-indigo-100 text-indigo-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700'
}

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch (error) {
    return value
  }
}

const normalizeId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value._id || value.id || value.$oid || ''
  }
  return String(value)
}

const TicketsPage = () => {
  const { user } = useAppContext()
  const role = user?.publicMetadata?.role || 'user'
  const isAuthorized = role === 'admin' || role === 'seller'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  })

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = useCallback(async () => {
    if (!isAuthorized) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.priority !== 'all') params.set('priority', filters.priority)

      const query = params.toString()
      const endpoint = query ? `/api/chat/ticket?${query}` : '/api/chat/ticket'

      const response = await fetch(endpoint, { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener los tickets')
      }

      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.priority, filters.status, isAuthorized])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesCategory = filters.category === 'all' || ticket.category === filters.category
      const matchesSearch = !searchTerm || [
        ticket.title,
        ticket.description,
        ticket.userId,
        ticket._id
      ].some((field) => (field || '').toString().toLowerCase().includes(searchTerm))
      return matchesCategory && matchesSearch
    })
  }, [filters.category, filters.search, tickets])

  const stats = useMemo(() => {
    return filteredTickets.reduce(
      (acc, ticket) => {
        const status = ticket.status || 'open'
        if (acc[status] === undefined) {
          acc[status] = 0
        }
        acc[status] += 1
        acc.total += 1
        return acc
      },
      { open: 0, in_progress: 0, waiting_user: 0, resolved: 0, closed: 0, escalated: 0, total: 0 }
    )
  }, [filteredTickets])

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedTicket(null)
    setMessages([])
    setReply('')
  }

  const openDetail = async (ticket) => {
    setSelectedTicket(ticket)
    setDetailOpen(true)
    setDetailLoading(true)

    const conversationId = normalizeId(ticket.conversationId)
    if (!conversationId) {
      toast.error('El ticket no tiene una conversación asociada')
      setDetailLoading(false)
      return
    }

    try {
      const params = new URLSearchParams({ includeMessages: 'true', limit: '200' })
      const response = await fetch(`/api/seller/chat/conversations/${conversationId}?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener los mensajes del ticket')
      }

      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (err) {
      console.error('Error fetching ticket detail:', err)
      setMessages([])
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReplySubmit = async (event) => {
    event.preventDefault()
    if (!selectedTicket) return
    const conversationId = normalizeId(selectedTicket.conversationId)
    if (!conversationId) {
      toast.error('No se encontró la conversación relacionada al ticket')
      return
    }

    const trimmed = reply.trim()
    if (!trimmed) {
      toast.error('La respuesta no puede estar vacía')
      return
    }

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage = {
      id: optimisticId,
      content: trimmed,
      sender: 'admin',
      type: 'text',
      createdAt: new Date().toISOString(),
      pending: true
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setReply('')
    setSending(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId, content: trimmed, type: 'text' })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible enviar la respuesta')
      }

      const savedMessage = data.message || {}
      const persistedId = savedMessage._id || savedMessage.id || optimisticId

      setMessages((prev) => prev.map((message) => (
        message.id === optimisticId
          ? {
              ...savedMessage,
              id: persistedId
            }
          : message
      )))

      setTickets((prev) => prev.map((ticket) => (
        ticket._id === selectedTicket._id
          ? { ...ticket, updatedAt: new Date().toISOString(), status: ticket.status === 'open' ? 'in_progress' : ticket.status }
          : ticket
      )))

      setSelectedTicket((prev) => (
        prev
          ? { ...prev, updatedAt: new Date().toISOString(), status: prev.status === 'open' ? 'in_progress' : prev.status }
          : prev
      ))

      toast.success('Respuesta enviada')
    } catch (err) {
      console.error('Error sending reply:', err)
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId))
      setReply(trimmed)
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Acceso denegado</h1>
          <p className="text-gray-600">Solo administradores o vendedores pueden gestionar tickets.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tickets de soporte</h1>
          <p className="text-sm text-gray-600">Gestiona las solicitudes enviadas por los clientes desde los chats con el asistente.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Abiertos</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">En progreso</p>
            <p className="text-2xl font-semibold text-sky-600">{stats.in_progress}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Esperando cliente</p>
            <p className="text-2xl font-semibold text-amber-600">{stats.waiting_user}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Escalados</p>
            <p className="text-2xl font-semibold text-rose-600">{stats.escalated}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Resueltos</p>
            <p className="text-2xl font-semibold text-emerald-600">{stats.resolved}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total filtrado</p>
            <p className="text-2xl font-semibold text-secondary-600">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm text-gray-600">Estado</label>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm text-gray-600">Prioridad</label>
              <select
                value={filters.priority}
                onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm text-gray-600">Categoría</label>
              <select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full lg:w-72">
              <input
                type="text"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Buscar por título, usuario o ID"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center"><Loading /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No se encontraron tickets con los filtros seleccionados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ticket</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Prioridad</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actualizado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{ticket.title}</span>
                          <span className="text-xs text-gray-500">ID: {ticket._id}</span>
                          <span className="text-xs text-gray-400">Creado: {formatDateTime(ticket.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityBadgeClass[ticket.priority] || 'bg-gray-100 text-gray-700'}`}>
                          {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">{ticket.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(ticket.updatedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ticket.userId}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(ticket)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary-600 text-white hover:bg-secondary-700 transition"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-500">Mostrando {filteredTickets.length} de {tickets.length} tickets disponibles.</p>
        </div>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ticket: {selectedTicket?.title}</h2>
                <p className="text-sm text-gray-500">ID: {selectedTicket?._id}</p>
              </div>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="sr-only">Cerrar</span>
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x flex-1 overflow-hidden">
              <div className="lg:col-span-2 p-6 space-y-4 overflow-y-auto">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass[selectedTicket?.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[selectedTicket?.status] || selectedTicket?.status}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${priorityBadgeClass[selectedTicket?.priority] || 'bg-gray-100 text-gray-700'}`}>
                      {PRIORITY_LABELS[selectedTicket?.priority] || selectedTicket?.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Resumen</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket?.description}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs text-gray-500">
                    <p><span className="font-medium text-gray-700">Categoría:</span> {selectedTicket?.category}</p>
                    <p><span className="font-medium text-gray-700">Creado:</span> {formatDateTime(selectedTicket?.createdAt)}</p>
                    <p><span className="font-medium text-gray-700">Actualizado:</span> {formatDateTime(selectedTicket?.updatedAt)}</p>
                    <p><span className="font-medium text-gray-700">Cliente:</span> {selectedTicket?.userId}</p>
                    {selectedTicket?.assignedTo && (
                      <p><span className="font-medium text-gray-700">Asignado a:</span> {selectedTicket?.assignedTo}</p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleReplySubmit} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Responder al cliente</label>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={4}
                      placeholder="Escribe tu respuesta..."
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z" />
                        </svg>
                      )}
                      Enviar respuesta
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-3 p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Historial de mensajes</h3>
                {detailLoading ? (
                  <div className="py-12 flex justify-center"><Loading /></div>
                ) : messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Aún no hay mensajes asociados a este ticket.
                  </div>
                ) : (
                  <div className="relative space-y-6">
                    {messages.map((message, index) => {
                      const senderType = message.sender || 'user'
                      const className = senderColors[senderType] || senderColors.user
                      const labelTone = senderBadgeColors[senderType] || senderBadgeColors.system
                      const isLast = index === messages.length - 1
                      return (
                        <div key={message.id || message._id || index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span className="h-3 w-3 rounded-full bg-secondary-500" />
                            {!isLast && <span className="flex-1 w-px bg-gray-200" />}
                          </div>
                          <div className={`flex-1 border rounded-xl p-4 shadow-sm text-gray-800 ${className}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${labelTone}`}>
                                {SENDER_LABELS[senderType] || senderType}
                              </span>
                              <span className="text-xs text-gray-600">{formatDateTime(message.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketsPage
