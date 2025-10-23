import { RAGService } from '@/src/infrastructure/rag/ragService.js';

class InMemoryDocumentRepository {
  constructor(documents = []) {
    this.documents = documents.map((doc, index) => ({
      _id: doc._id || doc.id || `doc-${index + 1}`,
      id: doc._id || doc.id || `doc-${index + 1}`,
      title: doc.title || `Documento ${index + 1}`,
      content: doc.content || '',
      contentText: doc.contentText || doc.content || '',
      type: doc.type || 'faq',
      category: doc.category || 'other',
      metadata: doc.metadata || {},
      vendorId: doc.vendorId || 'default_vendor',
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      chunks: Array.isArray(doc.chunks) ? doc.chunks.map(chunk => ({ ...chunk })) : [],
      lastIndexed: doc.lastIndexed || null,
      updatedAt: doc.updatedAt || new Date('2024-01-01T00:00:00.000Z'),
      createdAt: doc.createdAt || new Date('2024-01-01T00:00:00.000Z'),
    }));
    this.findAllCalls = 0;
  }

  async findAll(filters = {}) {
    this.findAllCalls += 1;
    return this.documents
      .filter(doc => {
        if (filters.isActive !== undefined && doc.isActive !== filters.isActive) {
          return false;
        }
        if (filters.vendorId && doc.vendorId !== filters.vendorId) {
          return false;
        }
        return true;
      })
      .map(doc => ({
        ...doc,
        chunks: doc.chunks.map(chunk => ({ ...chunk })),
      }));
  }

  async update(id, data) {
    const doc = this.documents.find(item => item._id === id || item.id === id);
    if (!doc) return null;

    if (Array.isArray(data.chunks)) {
      doc.chunks = data.chunks.map(chunk => ({ ...chunk }));
    }
    if (data.lastIndexed) {
      doc.lastIndexed = data.lastIndexed;
    }
    if (data.content) {
      doc.content = data.content;
    }
    if (data.contentText) {
      doc.contentText = data.contentText;
    }
    if (data.metadata) {
      doc.metadata = { ...doc.metadata, ...data.metadata };
    }

    // Mantener la marca de tiempo original si no se establece explícitamente
    if (data.updatedAt) {
      doc.updatedAt = data.updatedAt;
    }

    return {
      ...doc,
      chunks: doc.chunks.map(chunk => ({ ...chunk })),
    };
  }
}

function countDocumentChunkEmbeddings(service) {
  const defaultIndex = service.indices.get(service.getVendorKey()) || { embeddings: new Map() };
  return defaultIndex.embeddings?.size || 0;
}

describe('RAGService persistent indexing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reuses a loaded index across multiple searches without re-reading documents', async () => {
    const repository = new InMemoryDocumentRepository([
      {
        _id: 'doc-1',
        vendorId: 'vendor-1',
        title: 'Garantías de productos',
        type: 'faq',
        category: 'returns',
        content: 'Ofrecemos garantía de 2 años para laptops y 1 año para accesorios.',
      },
    ]);

    const ragService = new RAGService(repository, { defaultVendorId: 'vendor-1', chunkSize: 120 });
    const embeddingSpy = jest.spyOn(ragService, 'generateEmbedding');

    const firstResults = await ragService.search('¿Cuál es la garantía de las laptops?', {
      vendorId: 'vendor-1',
      limit: 3,
    });

    expect(firstResults.length).toBeGreaterThan(0);
    expect(repository.findAllCalls).toBe(1);
    const embeddingsAfterFirstSearch = embeddingSpy.mock.calls.length;

    const secondResults = await ragService.search('¿Ofrecen garantía para accesorios?', {
      vendorId: 'vendor-1',
      limit: 3,
    });

    expect(secondResults.length).toBeGreaterThan(0);
    expect(repository.findAllCalls).toBe(1);
    expect(embeddingSpy.mock.calls.length).toBe(embeddingsAfterFirstSearch + 1);
  });

  test('loads persisted chunks without recomputing embeddings for documents', async () => {
    const repository = new InMemoryDocumentRepository([
      {
        _id: 'doc-2',
        vendorId: 'vendor-2',
        title: 'Política de envíos',
        type: 'guide',
        category: 'shipping',
        content: 'Realizamos envíos nacionales en 48 horas y envíos internacionales en 7 días.',
      },
    ]);

    const firstService = new RAGService(repository, { defaultVendorId: 'vendor-2', chunkSize: 160 });
    await firstService.search('envíos nacionales', { vendorId: 'vendor-2', limit: 2 });
    const persistedEmbeddings = countDocumentChunkEmbeddings(firstService);
    expect(persistedEmbeddings).toBeGreaterThan(0);

    const secondService = new RAGService(repository, { defaultVendorId: 'vendor-2', chunkSize: 160 });
    const embeddingSpy = jest.spyOn(secondService, 'generateEmbedding');

    const results = await secondService.search('tiempos de envío', { vendorId: 'vendor-2', limit: 2 });

    expect(results.length).toBeGreaterThan(0);
    expect(repository.findAllCalls).toBe(2);
    expect(embeddingSpy.mock.calls.length).toBe(1);
  });
});
