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
    type: '',
    category: '',
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
      const response = await fetch('/api/admin/documents', {
        method: 'GET',
        headers: {
          Authorization: 'seller@tienda.com'
        },
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible obtener los documentos')
      }

      setDocuments(data.documents || [])
      setDocStats(data.stats || null)
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
          'Content-Type': 'application/json',
          Authorization: 'seller@tienda.com'
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
        headers: {
          Authorization: 'seller@tienda.com'
        },
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
      toast.error(error.message || 'Error obteniendo estado del índice RAG')
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

    if (newFile && newFile.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      event.target.value = ''
      setFile(null)
      return
    }

    setFile(newFile ?? null)
  }

  const resetForm = () => {
    setFormValues({ title: '', type: '', category: '', description: '' })
    setFile(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast.error('Selecciona un archivo PDF para subir')
      return
    }

    if (!formValues.title || !formValues.type || !formValues.category) {
      toast.error('Completa los campos requeridos')
      return
    }

    setUploading(true)

    try {
      const payload = new FormData()
      payload.append('file', file)
      payload.append('title', formValues.title)
      payload.append('type', formValues.type)
      payload.append('category', formValues.category)
      payload.append('description', formValues.description)

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          Authorization: 'seller@tienda.com'
        },
        body: payload
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible subir el documento')
      }

      toast.success('Documento subido exitosamente')
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
      const response = await fetch('/api/admin/documents/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'seller@tienda.com'
        },
        body: JSON.stringify({ documentId })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible indexar el documento')
      }

      toast.success('Documento enviado a indexación')
      await fetchRagStats({ force: true })
    } catch (error) {
      console.error('Error indexing document:', error)
      toast.error(error.message || 'Error indexando documento')
    } finally {
      setIndexing(false)
      setActiveDocumentAction(null)
    }
  }

  const handleReindexAll = async () => {
    setIndexing(true)
    setActiveDocumentAction('all')

    try {
      const response = await fetch('/api/admin/documents/index', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'seller@tienda.com'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible re-indexar los documentos')
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
      id: document.id || document.documentId || document._id,
      title: document.title || document.filename || document.name || 'Sin título',
      type: document.type || document.documentType || '—',
      category: document.category || '—',
      size: document.size || document.fileSize,
      isActive: document.isActive !== false,
      createdAt: document.createdAt || document.uploadDate,
      lastIndexed: document.lastIndexed,
      description: document.description || document.metadata?.description
    }))
  }, [documents])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Documentos del Chatbot</h1>
        <p className="text-sm text-gray-600">
          Gestiona los PDFs utilizados por el asistente y controla su indexación en el motor RAG.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir nuevo documento</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Manual de producto, política, etc."
              value={formValues.title}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
              required
            />
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="type" className="text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={formValues.type}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
              required
            >
              <option value="" disabled>
                Selecciona un tipo
              </option>
              {DOCUMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              id="category"
              name="category"
              value={formValues.category}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
              required
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {DOCUMENT_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descripción (opcional)
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Resumen del contenido o notas internas"
              value={formValues.description}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
          </div>

          <div className="col-span-1 flex flex-col gap-2">
            <label htmlFor="file" className="text-sm font-medium text-gray-700">
              Archivo PDF
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
            <p className="text-xs text-gray-500">Tamaño máximo: 10MB. Solo se aceptan archivos PDF.</p>
          </div>

          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingDisabled}
              className="inline-flex items-center justify-center rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:cursor-not-allowed disabled:bg-secondary-300"
            >
              {uploading ? 'Subiendo...' : 'Subir documento'}
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
              <h3 className="text-sm font-semibold text-gray-700">Índice RAG</h3>
              <p className="text-xs text-gray-500">Confirma que los documentos estén procesados para el chatbot.</p>
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
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documentos cargados</h2>
            <p className="text-sm text-gray-600">Lista de PDFs disponibles para el chatbot.</p>
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
            <p className="text-sm text-gray-500">Aún no has cargado documentos. Sube tu primer PDF para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Título</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Categoría</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Tamaño</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Estado</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Última indexación</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {documentRows.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{document.title}</div>
                      {document.description && (
                        <p className="text-xs text-gray-500">{document.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{document.type}</td>
                    <td className="px-4 py-3 text-gray-600">{document.category}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFileSize(document.size)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${document.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {document.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(document.lastIndexed)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleIndexDocument(document.id)}
                        disabled={indexing}
                        className="inline-flex items-center justify-center rounded-lg border border-secondary-600 px-3 py-1 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-50 disabled:cursor-not-allowed disabled:border-secondary-300 disabled:text-secondary-300"
                      >
                        {indexing && activeDocumentAction === document.id ? 'Indexando...' : 'Indexar'}
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
