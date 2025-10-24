'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const DOCUMENT_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'faq', label: 'Preguntas Frecuentes' },
  { value: 'policy', label: 'Política' },
  { value: 'guide', label: 'Guía' },
  { value: 'other', label: 'Otro' }
]

const DOCUMENT_CATEGORIES = [
  { value: 'products', label: 'Productos' },
  { value: 'orders', label: 'Órdenes' },
  { value: 'account', label: 'Cuenta' },
  { value: 'shipping', label: 'Envíos' },
  { value: 'returns', label: 'Devoluciones' },
  { value: 'technical', label: 'Soporte Técnico' },
  { value: 'other', label: 'Otro' }
]

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, index)

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const normalizeRagStats = (stats = {}) => {
  const documents = stats.documents ?? stats.processedDocuments ?? null
  const chunks = stats.chunks ?? stats.processedChunks ?? null
  const documentsFromList = Array.isArray(documents) ? documents.length : undefined
  const chunksFromList = Array.isArray(chunks) ? chunks.length : undefined

  const documentsIndexed =
    stats.documentsIndexed ??
    stats.documentsProcessed ??
    stats.totalDocuments ??
    stats.totalChunks ??
    documentsFromList ??
    0

  const chunksIndexed =
    stats.chunksIndexed ??
    stats.indexedChunks ??
    stats.totalChunks ??
    chunksFromList ??
    0

  const memoryUsage = stats.memoryUsage ?? stats.totalSize ?? '—'
  const lastUpdate = stats.lastUpdate ?? stats.updatedAt ?? null

  return {
    ...stats,
    documents,
    chunks,
    documentsIndexed,
    chunksIndexed,
    totalDocuments: stats.totalDocuments ?? documentsIndexed,
    totalChunks: stats.totalChunks ?? chunksIndexed,
    memoryUsage,
    lastUpdate,
    isLoaded: stats.isLoaded ?? stats.initialized ?? true
  }
}

const DocumentsPage = () => {
  const [formValues, setFormValues] = useState({
    title: '',
    description: ''
  })
  const [file, setFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [docStats, setDocStats] = useState(null)
  const [ragStats, setRagStats] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [rebuildingIndex, setRebuildingIndex] = useState(false)
  const [activeDocumentAction, setActiveDocumentAction] = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true)
    try {
      // Usar la API real de documentos RAG
      const response = await fetch('/api/rag/documents', {
        method: 'GET',
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener los documentos')
      }

      setDocuments(data.documents || [])

      // Calcular estadísticas desde los documentos
      const stats = {
        totalDocuments: data.documents?.length || 0,
        activeDocuments: data.documents?.filter(doc => doc.isActive !== false).length || 0,
        totalSize: data.documents?.reduce((sum, doc) => sum + (doc.fileSize || 0), 0) || 0
      }
      setDocStats(stats)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error(error.message || 'Error cargando documentos')
    } finally {
      setLoadingDocs(false)
    }
  }, [])

  const triggerReindex = useCallback(async () => {
    setRebuildingIndex(true)

    try {
      const response = await fetch('/api/admin/rag/rebuild', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        data = {}
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'No fue posible reconstruir el índice RAG')
      }

      if (data.stats) {
        setRagStats((prev) => ({
          ...prev,
          ...normalizeRagStats(data.stats)
        }))
      }

      return data
    } catch (error) {
      console.error('Error reconstruyendo índice RAG:', error)
      const message = error?.message || 'Error reconstruyendo índice RAG'
      toast.error(message)

      if (error && typeof error === 'object') {
        error.alreadyHandled = true
        throw error
      }

      const handledError = new Error(message)
      handledError.alreadyHandled = true
      throw handledError
    } finally {
      setRebuildingIndex(false)
    }
  }, [])

  const fetchRagStats = useCallback(async ({ force = true } = {}) => {
    setLoadingStats(true)
    try {
      const query = force ? '?force=true' : ''
      const response = await fetch(`/api/admin/rag/rebuild${query}`, {
        method: 'GET',
        cache: 'no-store'
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        data = {}
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'No fue posible obtener las estadísticas de indexación')
      }

      setRagStats(data.stats ? normalizeRagStats(data.stats) : null)
    } catch (error) {
      console.error('Error fetching RAG stats:', error)
      toast.error(error.message || 'Error obteniendo estado del sistema RAG')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      await fetchDocuments()

      try {
        await triggerReindex()
      } catch (error) {
        console.error('Initial RAG rebuild failed:', error)
      }

      await fetchRagStats({ force: true })
    }

    initialize()
  }, [fetchDocuments, fetchRagStats, triggerReindex])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event) => {
    const newFile = event.target.files?.[0]

    if (newFile && newFile.type !== 'text/plain') {
      toast.error('Solo se permiten archivos de texto (.txt)')
      event.target.value = ''
      setFile(null)
      return
    }

    setFile(newFile ?? null)
  }

  const resetForm = () => {
    setFormValues({ title: '', description: '' })
    setFile(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast.error('Selecciona un archivo de texto (.txt) para subir')
      return
    }

    if (!formValues.title) {
      toast.error('Completa el título y selecciona un archivo de texto')
      return
    }

    setUploading(true)

    try {
      const payload = new FormData()
      payload.append('file', file)
      payload.append('title', formValues.title)

      const response = await fetch('/api/rag/documents', {
        method: 'POST',
        body: payload
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible subir el documento')
      }

      toast.success('Documento subido exitosamente con embeddings reales')
      resetForm()
      await fetchDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error.message || 'Error subiendo documento')
    } finally {
      setUploading(false)
    }
  }

  const handleIndexDocument = async (documentId) => {
    setIndexing(true)
    setActiveDocumentAction(documentId)

    try {
      // Reconstruir índice completo usando la API real
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error procesando documento')
      }

      toast.success('Documento enviado a indexación')
      await fetchRagStats({ force: true })
    } catch (error) {
      console.error('Error indexing document:', error)
      toast.error('Error procesando documento')
    } finally {
      setIndexing(false)
      setActiveDocumentAction(null)
    }
  }

  const handleReindexAll = async () => {
    setIndexing(true)
    setActiveDocumentAction('all')

    try {
      // Reconstruir índice completo usando la API real
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error re-indexando documentos')
      }

      toast.success('Re-indexación iniciada correctamente')
      await triggerReindex()
      await fetchRagStats({ force: true })
    } catch (error) {
      console.error('Error reindexing documents:', error)
      if (!error?.alreadyHandled) {
        toast.error(error.message || 'Error re-indexando documentos')
      }
    } finally {
      setIndexing(false)
      setActiveDocumentAction(null)
    }
  }

  const isSubmittingDisabled = uploading || indexing

  const documentRows = useMemo(() => {
    if (!documents?.length) return []

    return documents.map((document) => ({
      id: document._id || document.id,
      title: document.title || document.fileName || 'Sin título',
      type: document.mimeType?.includes('text') ? 'Texto' : document.mimeType || 'Texto',
      category: document.category || 'Documentos RAG',
      size: document.fileSize || 0,
      isActive: document.isActive !== false,
      createdAt: document.createdAt || document.updatedAt,
      lastIndexed: document.lastIndexed || document.updatedAt,
      description: document.content?.substring(0, 100)?.replace(/[^\x20-\x7E\n]/g, '').replace(/\n/g, ' ') + '...' || 'Documento para mejorar respuestas del chatbot'
    }))
  }, [documents])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Documentos RAG del Chatbot</h1>
        <p className="text-sm text-gray-600">
          Gestiona los documentos que mejoran las respuestas del asistente con tecnología RAG (Retrieval-Augmented Generation).
        </p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir nuevo documento</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="col-span-2 flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Título del documento
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Ej: Políticas de la tienda, Manual de productos..."
              value={formValues.title}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
              required
            />
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="file" className="text-sm font-medium text-gray-700">
              Archivo para RAG
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
            <p className="text-xs text-gray-500">Sube archivos de texto (.txt). El sistema procesará el contenido para mejorar las respuestas del chatbot.</p>
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Estado del procesamiento</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                {uploading ? '📤 Subiendo documento...' :
                 file && formValues.title ? '✅ Todo listo para procesar' :
                 file ? '📝 Completa el título del documento' :
                 '⏳ Esperando archivo...'}
              </p>
              {file && (
                <p className="text-xs text-gray-500 mt-1">
                  {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingDisabled || !file || !formValues.title}
              className="inline-flex items-center justify-center rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:cursor-not-allowed disabled:bg-secondary-300"
            >
              {uploading ? 'Subiendo...' : '🚀 Procesar con RAG (Real)'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Estado de documentos</h3>
          {loadingDocs ? (
            <p className="mt-3 text-sm text-gray-500">Cargando...</p>
          ) : docStats ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Total</dt>
                <dd className="text-lg font-semibold text-secondary-700">{docStats.totalDocuments ?? 0}</dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Activos</dt>
                <dd className="text-lg font-semibold text-secondary-700">{docStats.activeDocuments ?? 0}</dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Peso total</dt>
                <dd className="text-lg font-semibold text-secondary-700">{formatFileSize(docStats.totalSize)}</dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Última carga</dt>
                <dd className="text-sm font-medium text-secondary-700">
                  {documents?.[0]?.createdAt ? formatDate(documents[0].createdAt) : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No hay información disponible.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Sistema RAG</h3>
              <p className="text-xs text-gray-500">Estado del sistema de Retrieval-Augmented Generation.</p>
            </div>
            <button
              onClick={handleReindexAll}
              disabled={indexing || rebuildingIndex}
              className="inline-flex items-center justify-center rounded-lg border border-secondary-600 px-3 py-1 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-50 disabled:cursor-not-allowed disabled:border-secondary-300 disabled:text-secondary-300"
            >
              {rebuildingIndex || (indexing && activeDocumentAction === 'all') ? 'Reindexando...' : 'Re-indexar todo'}
            </button>
          </div>

          {rebuildingIndex ? (
            <p className="mt-3 text-sm text-secondary-600">Reconstruyendo índice...</p>
          ) : loadingStats ? (
            <p className="mt-3 text-sm text-gray-500">Cargando...</p>
          ) : ragStats ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Documentos indexados</dt>
                <dd className="text-lg font-semibold text-secondary-700">
                  {ragStats.documentsIndexed ?? ragStats.totalDocuments ?? 0}
                </dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Chunks indexados</dt>
                <dd className="text-lg font-semibold text-secondary-700">
                  {ragStats.chunksIndexed ?? ragStats.indexedChunks ?? 0}
                </dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Memoria</dt>
                <dd className="text-sm font-semibold text-secondary-700">{ragStats.memoryUsage || '—'}</dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Última actualización</dt>
                <dd className="text-sm font-medium text-secondary-700">{formatDate(ragStats.lastUpdate)}</dd>
              </div>
              <div className="rounded-lg bg-secondary-50 p-3">
                <dt className="text-gray-500">Estado</dt>
                <dd className="text-sm font-medium text-secondary-700">
                  {ragStats.isLoaded === false ? 'Sin inicializar' : 'Activo'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No hay estadísticas disponibles.</p>
          )}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              🤖 Cómo funciona el sistema RAG:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sube documentos PDF o texto con información de tu tienda</li>
              <li>• El sistema procesa automáticamente el contenido y crea embeddings</li>
              <li>• Cuando los clientes preguntan, el chatbot busca primero en tus documentos</li>
              <li>• Si encuentra información relevante, responde usando ese contexto</li>
              <li>• Si no encuentra, usa la información de productos o respuestas generales</li>
            </ul>
            <div className="mt-3 text-xs text-blue-700">
              💡 <strong>Tip:</strong> Sube documentos con políticas, manuales, FAQs y guías para mejorar las respuestas del chatbot.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documentos RAG cargados</h2>
            <p className="text-sm text-gray-600">Documentos disponibles para mejorar las respuestas del chatbot con RAG.</p>
          </div>
          <button
            onClick={fetchDocuments}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Actualizar lista
          </button>
        </div>

        {loadingDocs ? (
          <p className="text-sm text-gray-500">Cargando documentos...</p>
        ) : documentRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-500">Aún no has cargado documentos RAG. Sube PDFs o archivos de texto para mejorar las respuestas del chatbot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Documento</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Tamaño</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Estado</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Subido</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {documentRows.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{document.title}</div>
                      <p className="text-xs text-gray-500">{document.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{document.type}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFileSize(document.size)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${document.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {document.isActive ? 'Procesado' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(document.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleIndexDocument(document.id)}
                        disabled={indexing}
                        className="inline-flex items-center justify-center rounded-lg border border-secondary-600 px-3 py-1 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-50 disabled:cursor-not-allowed disabled:border-secondary-300 disabled:text-secondary-300"
                      >
                        {indexing && activeDocumentAction === document.id ? 'Procesando...' : 'Procesar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default DocumentsPage
