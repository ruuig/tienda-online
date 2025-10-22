// Página de gestión de pedidos para vendedores
'use client';
import React, { useState, useEffect } from 'react';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Por ahora simulamos datos, en producción conectar con API real
      setOrders([
        {
          _id: '1',
          orderNumber: 'ORD-001',
          customerName: 'María González',
          customerEmail: 'maria@email.com',
          items: [
            { name: 'iPhone 15 Pro', quantity: 1, price: 899.99 },
            { name: 'AirPods Pro', quantity: 2, price: 249.99 }
          ],
          total: 1399.97,
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          shippingAddress: 'Zona 10, Guatemala City'
        },
        {
          _id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Carlos Rodríguez',
          customerEmail: 'carlos@email.com',
          items: [
            { name: 'MacBook Air M3', quantity: 1, price: 1199.99 }
          ],
          total: 1199.99,
          status: 'shipped',
          createdAt: '2024-01-14T15:20:00Z',
          shippingAddress: 'Zona 15, Guatemala City'
        },
        {
          _id: '3',
          orderNumber: 'ORD-003',
          customerName: 'Ana López',
          customerEmail: 'ana@email.com',
          items: [
            { name: 'Apple Watch Series 9', quantity: 1, price: 429.99 }
          ],
          total: 429.99,
          status: 'delivered',
          createdAt: '2024-01-13T09:45:00Z',
          shippingAddress: 'Zona 1, Guatemala City'
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Aquí iría la llamada a la API para actualizar el estado
      const updatedOrders = orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      setMessage(`✅ Pedido actualizado a ${newStatus}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      setMessage('❌ Error actualizando pedido');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filteredOrders = orders.filter(order => {
    return filterStatus === 'all' || order.status === filterStatus;
  });

  const statusOptions = [
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processing', label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  const getStatusLabel = (status) => {
    return statusOptions.find(opt => opt.value === status)?.label || status;
  };

  const getStatusColor = (status) => {
    return statusOptions.find(opt => opt.value === status)?.color || 'bg-gray-100 text-gray-800';
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
      {/* Mensaje de estado */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600">Administra los pedidos y ventas de tu tienda</p>
        </div>
        <div className="text-sm text-gray-500">
          Total de pedidos: {orders.length}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los pedidos</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {statusOptions.map(option => (
              <div key={option.value} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${option.color.replace('text-', 'bg-').replace('-800', '-500')}`}></div>
                <span className="text-sm text-gray-600 ml-1">{option.label}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({orders.filter(o => o.status === option.value).length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pedido #{order.orderNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Cliente: {order.customerName} ({order.customerEmail})
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  Q{order.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del pedido */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">Q{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Dirección de envío</p>
                  <p className="text-sm text-blue-800">{order.shippingAddress}</p>
                </div>
              </div>

              {/* Acciones del pedido */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Acciones</h4>
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'processing')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Marcar como Procesando
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'shipped')}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Marcar como Enviado
                    </button>
                  )}

                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'delivered')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Marcar como Entregado
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ver Detalles
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Creado: {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Pedido #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Información del Cliente</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedOrder.shippingAddress}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Estado del Pedido</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Estado actual:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total:</span>
                      <span className="font-bold text-lg">Q{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Productos del Pedido</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">Q{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
