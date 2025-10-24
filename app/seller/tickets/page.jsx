'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '@/context/AppContext'
import Loading from '@/src/presentation/components/Loading'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Pendiente' },
  { value: 'resolved', label: 'Resueltos' },
]

const STATUS_FILTER_MAP = {
  all: null,
  open: ['open', 'in_progress', 'waiting_user', 'escalated', 'closed'],
  resolved: ['resolved']
}

const STATUS_UPDATE_OPTIONS = STATUS_OPTIONS.filter((option) => option.value !== 'all')

const STATUS_LABELS = {
  open: 'Pendiente',
  in_progress: 'Pendiente',
  waiting_user: 'Pendiente',
  escalated: 'Pendiente',
  closed: 'Pendiente',
  resolved: 'Resuelto'
}

const SENDER_LABELS = {
  user: 'Cliente',
  admin: 'Agente',
  bot: 'Asistente',
  system: 'Sistema'
}

const statusBadgeClass = {
  open: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-sky-100 text-sky-700',
  waiting_user: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-200 text-gray-700',
  escalated: 'bg-rose-100 text-rose-700'
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
    status: 'all'
  })

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [messages, setMessages] = useState([])

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, detailOpen])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setSelectedTicket(null)
    setReply('')
    setMessages([])
    setDetailLoading(false)
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!isAuthorized) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') {
        const statusValues = STATUS_FILTER_MAP[filters.status]
        if (Array.isArray(statusValues) && statusValues.length > 0) {
          params.set('status', statusValues.join(','))
        } else if (!statusValues) {
          params.delete('status')
        }
      }

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
  }, [filters.status, isAuthorized])

  const handleStatusUpdate = useCallback(async (ticketId, newStatus) => {
    if (!newStatus) return

    setUpdatingStatusId(ticketId)

    try {
      const response = await fetch(`/api/seller/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible actualizar el estado')
      }

      const updated = data.ticket
      setTickets((prev) => prev.map((ticket) => (
        ticket._id === ticketId
          ? { ...ticket, status: updated.status, updatedAt: updated.updatedAt }
          : ticket
      )))

      if (selectedTicket?._id === ticketId) {
        setSelectedTicket((prev) => (
          prev
            ? { ...prev, status: updated.status, updatedAt: updated.updatedAt }
            : prev
        ))
      }

      toast.success('Estado actualizado')
    } catch (err) {
      console.error('Error updating ticket status:', err)
      toast.error(err.message)
    } finally {
      setUpdatingStatusId('')
    }
  }, [selectedTicket])

  const handleDelete = useCallback((ticketId) => {
    if (!ticketId) return

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-800">¿Eliminar ticket?</p>
        <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              setDeletingId(ticketId)

              try {
                const response = await fetch(`/api/seller/tickets/${ticketId}`, {
                  method: 'DELETE'
                })

                const data = await response.json()
                if (!response.ok || !data.success) {
                  throw new Error(data.message || 'No fue posible eliminar el ticket')
                }

                setTickets((prev) => prev.filter((ticket) => ticket._id !== ticketId))

                if (selectedTicket?._id === ticketId) {
                  closeDetail()
                }

                toast.success('Ticket eliminado')
              } catch (err) {
                console.error('Error deleting ticket:', err)
                toast.error(err.message)
              } finally {
                setDeletingId('')
              }
            }}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    })
  }, [closeDetail, selectedTicket])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = useMemo(() => {
    return tickets
  }, [tickets])

  const stats = useMemo(() => {
    return filteredTickets.reduce(
      (acc, ticket) => {
        const status = ticket.status || 'open'
        const isResolved = status === 'resolved'

        if (isResolved) {
          acc.resolved += 1
        } else {
          acc.pending += 1
        }

        acc.total += 1
        return acc
      },
      { pending: 0, resolved: 0, total: 0 }
    )
  }, [filteredTickets])

  const openDetail = async (ticket) => {
    setSelectedTicket(ticket)
    setDetailOpen(true)
    setMessages([])
    setDetailLoading(true)

    try {
      const response = await fetch(`/api/seller/tickets/${ticket._id}`)
      const data = await response.json()

      if (!response.ok || !data.success || !data.ticket) {
        throw new Error(data.message || 'No fue posible obtener la información del ticket')
      }

      setSelectedTicket(data.ticket)
      setMessages(Array.isArray(data.ticket.messages) ? data.ticket.messages : [])
      setTickets((prev) => prev.map((item) => (
        item._id === data.ticket._id
          ? { ...item, status: data.ticket.status, updatedAt: data.ticket.updatedAt }
          : item
      )))
    } catch (err) {
      console.error('Error fetching ticket detail:', err)
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReplySubmit = async (event) => {
    event.preventDefault()
    if (!selectedTicket) return
    const trimmed = reply.trim()
    if (!trimmed) {
      toast.error('La respuesta no puede estar vacía')
      return
    }

    if (!selectedTicket.userId) {
      toast.error('El ticket no tiene un correo asociado')
      return
    }

    setReply('')
    setSending(true)

    try {
      const response = await fetch('/api/seller/tickets/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          to: selectedTicket.userId,
          message: trimmed
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible enviar el correo')
      }

      const storedMessage = data.message || {
        senderType: 'admin',
        senderId: 'soporterjgtechshop@gmail.com',
        content: trimmed,
        type: 'text',
        metadata: { channel: 'email', sentBy: 'seller-panel' },
        createdAt: new Date().toISOString()
      }

      setTickets((prev) => prev.map((ticket) => (
        ticket._id === selectedTicket._id
          ? { ...ticket, updatedAt: new Date().toISOString(), status: ticket.status === 'open' ? 'in_progress' : ticket.status }
          : ticket
      )))

      setSelectedTicket((prev) => (
        prev
          ? {
              ...prev,
              updatedAt: new Date().toISOString(),
              status: prev.status === 'open' ? 'in_progress' : prev.status,
              messages: Array.isArray(prev.messages) ? [...prev.messages, storedMessage] : [storedMessage]
            }
          : prev
      ))

      setMessages((prev) => [...prev, storedMessage])

      toast.success('Correo enviado al cliente')
    } catch (err) {
      console.error('Error sending reply:', err)
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Pendientes</p>
            <p className="text-2xl font-semibold text-orange-600">{stats.pending}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Resueltos</p>
            <p className="text-2xl font-semibold text-emerald-600">{stats.resolved}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-secondary-600">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
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
                          {ticket.metadata?.subject && (
                            <span className="text-xs text-secondary-600">Asunto: {ticket.metadata.subject}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(ticket.updatedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ticket.userId}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <select
                            value={ticket.status}
                            onChange={(event) => handleStatusUpdate(ticket._id, event.target.value)}
                            disabled={updatingStatusId === ticket._id}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-60"
                          >
                            {STATUS_UPDATE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => openDetail(ticket)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary-600 text-white hover:bg-secondary-700 transition"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => handleDelete(ticket._id)}
                            disabled={deletingId === ticket._id}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {deletingId === ticket._id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
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
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass[selectedTicket?.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[selectedTicket?.status] || selectedTicket?.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Resumen</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket?.description}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs text-gray-500">
                    <p><span className="font-medium text-gray-700">Creado:</span> {formatDateTime(selectedTicket?.createdAt)}</p>
                    <p><span className="font-medium text-gray-700">Actualizado:</span> {formatDateTime(selectedTicket?.updatedAt)}</p>
                    <p><span className="font-medium text-gray-700">Cliente:</span> {selectedTicket?.userId}</p>
                    {selectedTicket?.assignedTo && (
                      <p><span className="font-medium text-gray-700">Asignado a:</span> {selectedTicket?.assignedTo}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Responder al cliente</h3>
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Correo del destinatario</label>
                    <input
                      type="email"
                      value={selectedTicket?.userId || ''}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    />
                  </div>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={8}
                    placeholder="Escribe tu respuesta..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary-600 px-5 py-2 text-sm font-medium text-white hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketsPage
