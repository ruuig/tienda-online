'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Loading from '@/src/presentation/components/Loading'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'escalated', label: 'Escalados' },
  { value: 'closed', label: 'Cerrados' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' }
]

const DEFAULT_MIN_MESSAGES = 4

const ChatSessionsPage = () => {
  const [filters, setFilters] = useState({
    status: 'active',
    minMessages: DEFAULT_MIN_MESSAGES,
    persistedOnly: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [conversations, setConversations] = useState([])
  const [stats, setStats] = useState({ active: 0, escalated: 0, closed: 0, total: 0 })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [assignmentInput, setAssignmentInput] = useState('')

  const vendorId = process.env.NEXT_PUBLIC_VENDOR_ID || 'default_vendor'

  const fetchConversations = useCallback(async (pageOverride) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      const pageToLoad = pageOverride || 1
      params.set('page', pageToLoad.toString())
      params.set('limit', pagination.limit.toString())

      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status)
      }

      if (filters.minMessages) {
        params.set('minMessages', filters.minMessages.toString())
      }

      if (filters.persistedOnly) {
        params.set('persistedOnly', 'true')
      }

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      const response = await fetch(`/api/seller/chat/conversations?${params.toString()}`, {
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener las conversaciones')
      }

      setConversations(data.conversations || [])
      setStats(data.stats || { active: 0, escalated: 0, closed: 0, total: 0 })
      setPagination({
        page: data.pagination?.page || pageToLoad,
        pages: data.pagination?.pages || 1,
        total: data.pagination?.total || 0,
        limit: data.pagination?.limit || pagination.limit
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching conversations:', err)
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.minMessages, filters.persistedOnly, searchTerm, pagination.limit])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchConversations(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      setAssignmentInput(selectedConversation.assignedTo || '')
    }
  }, [selectedConversation])

  const handleViewConversation = async (conversationId) => {
    setModalLoading(true)
    setIsModalOpen(true)
    try {
      const params = new URLSearchParams({ includeMessages: 'true', limit: '400' })
      const response = await fetch(`/api/seller/chat/conversations/${conversationId}?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener la conversación')
      }

      setSelectedConversation(data.conversation)
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error fetching conversation detail:', err)
      toast.error(err.message)
      setIsModalOpen(false)
    } finally {
      setModalLoading(false)
    }
  }

  const updateConversation = async (conversationId, payload, successMessage) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/seller/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible actualizar la conversación')
      }

      setConversations(prev => prev.map(conv => (
        conv.id === conversationId ? data.conversation : conv
      )))

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(data.conversation)
      }

      if (successMessage) {
        toast.success(successMessage)
      }
    } catch (err) {
      console.error('Error updating conversation:', err)
      toast.error(err.message)
    } finally {
      setUpdating(false)
      fetchConversations(pagination.page)
    }
  }

  const handleCloseConversation = (conversationId) => {
    updateConversation(conversationId, { status: 'closed' }, 'Conversación cerrada correctamente')
  }

  const handleReopenConversation = (conversationId) => {
    updateConversation(conversationId, { status: 'active', endedAt: null }, 'Conversación reactivada')
  }

  const handleEscalateConversation = (conversationId) => {
    updateConversation(conversationId, { status: 'escalated' }, 'Conversación escalada a un agente')
  }

  const handleSaveAssignment = (conversationId) => {
    updateConversation(conversationId, { assignedTo: assignmentInput || null }, 'Asignación actualizada')
  }

  const handlePriorityChange = (conversationId, priority) => {
    updateConversation(conversationId, { priority }, 'Prioridad actualizada')
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedConversation(null)
    setMessages([])
  }

  const renderStatusBadge = (status) => {
    const colorMap = {
      active: 'bg-emerald-100 text-emerald-800',
      escalated: 'bg-amber-100 text-amber-800',
      closed: 'bg-gray-200 text-gray-700'
    }
    const labelMap = {
      active: 'Activa',
      escalated: 'Escalada',
      closed: 'Cerrada'
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
        {labelMap[status] || status}
      </span>
    )
  }

  const renderPriorityBadge = (priority) => {
    const colorMap = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-violet-100 text-violet-800',
      high: 'bg-rose-100 text-rose-800'
    }
    const labelMap = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta'
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorMap[priority] || 'bg-gray-100 text-gray-700'}`}>
        {labelMap[priority] || priority}
      </span>
    )
  }

  const emptyState = !loading && conversations.length === 0

  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chats automáticos</h1>
            <p className="text-sm text-gray-600">Administra las conversaciones activas que superaron los {DEFAULT_MIN_MESSAGES} mensajes con el bot.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Escalados</p>
              <p className="text-2xl font-bold text-amber-600">{stats.escalated}</p>
            </div>
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Cerrados</p>
              <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
            </div>
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total histórico</p>
              <p className="text-2xl font-bold text-secondary-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Mensajes mínimos</label>
              <input
                type="number"
                min={0}
                value={filters.minMessages}
                onChange={(e) => setFilters(prev => ({ ...prev, minMessages: Math.max(Number(e.target.value) || 0, 0) }))}
                className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={filters.persistedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, persistedOnly: e.target.checked }))}
                className="rounded border-gray-300 text-secondary-500 focus:ring-secondary-500"
              />
              Solo conversaciones persistidas
            </label>

            <div className="relative w-full lg:w-80">
              <input
                type="text"
                placeholder="Buscar por usuario, sesión o IP"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
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
            <div className="py-10 flex justify-center"><Loading /></div>
          ) : emptyState ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No hay conversaciones que cumplan con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Prioridad</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mensajes</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Última actividad</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Asignado a</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {conversations.map(conversation => (
                    <tr key={conversation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{conversation.userId}</span>
                          <span className="text-xs text-gray-500">Sesión: {conversation.sessionId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        {renderStatusBadge(conversation.status)}
                        <div className="text-xs text-gray-500">{conversation.isPersisted ? 'Persistida' : 'Temporal'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {renderPriorityBadge(conversation.priority)}
                          <select
                            className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-secondary-500"
                            value={conversation.priority}
                            onChange={(e) => handlePriorityChange(conversation.id, e.target.value)}
                            disabled={updating}
                          >
                            {PRIORITY_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{conversation.messageCount}</span>
                        <p className="text-xs text-gray-500 max-w-[200px] truncate">{conversation.lastMessagePreview || 'Sin resumen disponible'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {conversation.lastActivity ? new Date(conversation.lastActivity).toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Inicio: {conversation.startedAt ? new Date(conversation.startedAt).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {conversation.assignedTo || 'No asignado'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewConversation(conversation.id)}
                            className="px-3 py-1 text-xs rounded-md border border-secondary-200 text-secondary-600 hover:bg-secondary-50"
                          >
                            Ver detalle
                          </button>
                          {conversation.status !== 'closed' && (
                            <button
                              onClick={() => handleCloseConversation(conversation.id)}
                              className="px-3 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                              disabled={updating}
                            >
                              Cerrar
                            </button>
                          )}
                          {conversation.status === 'closed' && (
                            <button
                              onClick={() => handleReopenConversation(conversation.id)}
                              className="px-3 py-1 text-xs rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              disabled={updating}
                            >
                              Reabrir
                            </button>
                          )}
                          {conversation.status !== 'escalated' && (
                            <button
                              onClick={() => handleEscalateConversation(conversation.id)}
                              className="px-3 py-1 text-xs rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50"
                              disabled={updating}
                            >
                              Escalar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !emptyState && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Mostrando {(pagination.page - 1) * pagination.limit + 1} -
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                  onClick={() => fetchConversations(Math.max(pagination.page - 1, 1))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </button>
                <span>Página {pagination.page} de {pagination.pages}</span>
                <button
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                  onClick={() => fetchConversations(Math.min(pagination.page + 1, pagination.pages))}
                  disabled={pagination.page === pagination.pages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detalle de conversación</h2>
                {selectedConversation && (
                  <p className="text-xs text-gray-500">ID: {selectedConversation.id} · Vendor: {vendorId}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 py-4">
              <div className="lg:col-span-1 space-y-4">
                {modalLoading || !selectedConversation ? (
                  <div className="py-10 flex justify-center"><Loading /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border rounded-md p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700">Información general</h3>
                      <p className="text-sm text-gray-600"><span className="font-medium">Cliente:</span> {selectedConversation.userId}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Sesión:</span> {selectedConversation.sessionId || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Última actividad:</span> {selectedConversation.lastActivity ? new Date(selectedConversation.lastActivity).toLocaleString() : 'N/A'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">IP:</span> {selectedConversation.metadata?.ipAddress || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Agente asignado:</span> {selectedConversation.assignedTo || 'No asignado'}</p>
                    </div>

                    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700">Administrar</h3>
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Asignar a</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={assignmentInput}
                            onChange={(e) => setAssignmentInput(e.target.value)}
                            placeholder="ID o correo del agente"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          />
                          <button
                            onClick={() => handleSaveAssignment(selectedConversation.id)}
                            className="px-3 py-2 text-xs rounded-md bg-secondary-600 text-white hover:bg-secondary-700"
                            disabled={updating}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Estado rápido</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReopenConversation(selectedConversation.id)}
                            className="px-3 py-1 text-xs rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            disabled={updating}
                          >
                            Marcar activa
                          </button>
                          <button
                            onClick={() => handleEscalateConversation(selectedConversation.id)}
                            className="px-3 py-1 text-xs rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50"
                            disabled={updating}
                          >
                            Escalar
                          </button>
                          <button
                            onClick={() => handleCloseConversation(selectedConversation.id)}
                            className="px-3 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                            disabled={updating}
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="border rounded-md h-[420px] overflow-y-auto bg-gray-50">
                  {modalLoading ? (
                    <div className="py-10 flex justify-center"><Loading /></div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">Aún no hay mensajes registrados en esta conversación.</div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                            message.sender === 'user'
                              ? 'bg-white border border-gray-200'
                              : message.sender === 'bot'
                                ? 'bg-secondary-50 border border-secondary-100'
                                : 'bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span className="font-medium text-gray-700">{message.sender === 'bot' ? 'Bot' : message.sender === 'admin' ? 'Agente' : 'Cliente'}</span>
                            <span>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                          {message.metadata?.intent && (
                            <p className="mt-2 text-xs text-gray-500">Intención detectada: {message.metadata.intent}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSessionsPage
