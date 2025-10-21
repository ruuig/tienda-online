// Página de gestión de tickets
'use client';
import React, { useState, useEffect } from 'react';

const TicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // Aquí iría la llamada a la API de tickets
      // Por ahora simulamos datos
      setTickets([
        {
          id: '1',
          conversationId: 'conv1',
          userId: 'user1',
          userName: 'Juan Pérez',
          title: 'Problema con pedido #1234',
          description: 'No he recibido mi pedido después de 2 semanas',
          status: 'in_progress',
          priority: 'high',
          category: 'orders',
          assignedTo: 'admin1',
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-21T09:00:00Z'
        },
        {
          id: '2',
          conversationId: 'conv2',
          userId: 'user2',
          userName: 'María González',
          title: 'Consulta sobre garantía',
          description: '¿Cuánto tiempo dura la garantía de los productos?',
          status: 'open',
          priority: 'medium',
          category: 'products',
          assignedTo: null,
          createdAt: '2024-01-21T14:30:00Z',
          updatedAt: '2024-01-21T14:30:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      // Aquí iría la llamada a la API para actualizar el ticket
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket
      ));
    } catch (error) {
      console.error('Error actualizando ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de Soporte</h1>
          <p className="text-gray-600">Gestión de consultas y problemas reportados</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'open'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Abiertos
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'in_progress'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            En Proceso
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'resolved'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Resueltos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de tickets */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Tickets</h2>
            <p className="text-sm text-gray-600">{filteredTickets.length} tickets encontrados</p>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketSelect(ticket)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : ticket.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : ticket.status === 'resolved'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ticket.status === 'open' ? 'Abierto' :
                       ticket.status === 'in_progress' ? 'En Proceso' :
                       ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-1">{ticket.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{ticket.userName}</p>
                <p className="text-sm text-gray-500 truncate">{ticket.description}</p>

                {ticket.assignedTo && (
                  <div className="mt-2 text-xs text-blue-600">
                    Asignado a: Admin {ticket.assignedTo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel de detalle de ticket */}
        <div className="bg-white rounded-lg shadow">
          {selectedTicket ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedTicket.title}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Abierto</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="waiting_user">Esperando Usuario</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={selectedTicket.priority}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedTicket.category}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <p className="text-sm text-gray-900">{selectedTicket.userName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar administrador</option>
                    <option value="admin1">Admin 1</option>
                    <option value="admin2">Admin 2</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">
                    Guardar Cambios
                  </button>
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg">
                    Ver Conversación
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Selecciona un ticket para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsManagement;
