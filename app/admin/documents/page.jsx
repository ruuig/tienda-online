// Página de gestión de documentos RAG
'use client';
import React, { useState, useEffect } from 'react';

const DocumentsManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ragStats, setRagStats] = useState({ totalDocuments: 0, indexedChunks: 0 });

  useEffect(() => {
    fetchDocuments();
    fetchRAGStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Aquí iría la llamada a la API de documentos
      // Por ahora simulamos datos
      setDocuments([
        {
          id: '1',
          title: 'Política de Devoluciones',
          type: 'policy',
          category: 'returns',
          isActive: true,
          createdAt: '2024-01-15',
          size: '2.5 KB'
        },
        {
          id: '2',
          title: 'Guía de Productos Apple',
          type: 'guide',
          category: 'products',
          isActive: true,
          createdAt: '2024-01-16',
          size: '5.1 KB'
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRAGStats = async () => {
    try {
      // Aquí iría la llamada a la API de estadísticas RAG
      setRagStats({
        totalDocuments: 25,
        indexedChunks: 150
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas RAG:', error);
    }
  };

  const handleRebuildIndex = async () => {
    try {
      // Aquí iría la llamada a la API para reconstruir índice
      alert('Índice RAG reconstruido exitosamente');
      fetchRAGStats();
    } catch (error) {
      console.error('Error reconstruyendo índice:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Documentos RAG</h1>
          <p className="text-gray-600">Gestión de documentos para el sistema de IA</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Agregar Documento
        </button>
      </div>

      {/* Estadísticas RAG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documentos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{ragStats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chunks Indexados</p>
              <p className="text-2xl font-bold text-gray-900">{ragStats.indexedChunks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleRebuildIndex}
            className="w-full h-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Reconstruir Índice
          </button>
        </div>
      </div>

      {/* Tabla de documentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamaño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{document.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    document.type === 'policy'
                      ? 'bg-blue-100 text-blue-800'
                      : document.type === 'guide'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {document.type === 'policy' ? 'Política' :
                     document.type === 'guide' ? 'Guía' :
                     document.type === 'faq' ? 'FAQ' : 'Otro'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {document.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {document.size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    document.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {document.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(document.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Editar
                  </button>
                  <button className={`${
                    document.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                  }`}>
                    {document.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario para agregar documento (simplificado) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar Documento</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título del documento"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Tipo de documento</option>
                <option value="policy">Política</option>
                <option value="guide">Guía</option>
                <option value="faq">FAQ</option>
              </select>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Categoría</option>
                <option value="products">Productos</option>
                <option value="orders">Pedidos</option>
                <option value="returns">Devoluciones</option>
              </select>
              <textarea
                placeholder="Contenido del documento..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsManagement;
