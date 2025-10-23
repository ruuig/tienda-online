import { join } from 'path';
import { pathToFileURL } from 'url';

const savedDocuments = [];
const savedChunks = [];

jest.mock('../../../../src/infrastructure/database/db.js', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../src/infrastructure/database/models/index.js', () => ({
  __esModule: true,
  Document: {
    create: jest.fn(async (data) => {
      const document = { _id: `doc_${savedDocuments.length + 1}`, ...data };
      savedDocuments.push(document);
      return document;
    }),
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    })),
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
  DocumentChunk: {
    insertMany: jest.fn(async (chunks) => {
      savedChunks.push(...chunks);
      return chunks.map((chunk, index) => ({ _id: `chunk_${index + 1}`, ...chunk }));
    }),
  },
  PromptConfig: {
    findOne: jest.fn().mockResolvedValue(null),
  },
  Conversation: {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    })),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
  },
  Message: {
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));

const mockDocumentRepository = { findAll: jest.fn().mockResolvedValue([]) };

jest.mock('../../../../src/infrastructure/database/repositories.js', () => ({
  __esModule: true,
  DocumentRepositoryImpl: jest.fn().mockImplementation(() => mockDocumentRepository),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
}));

describe('Vendor dashboard document upload', () => {
  let originalEnv;
  let POST;

  beforeAll(async () => {
    originalEnv = { ...process.env };

    const nextResponsePath = pathToFileURL(join(process.cwd(), '__tests__', 'mocks', 'nextResponseMock.js')).href;
    const pdfParsePath = pathToFileURL(join(process.cwd(), '__tests__', 'mocks', 'pdfParseMock.js')).href;

    process.env.NEXT_SERVER_TEST_MODULE_PATH = nextResponsePath;
    process.env.PDF_PARSE_TEST_MODULE_PATH = pdfParsePath;
    process.env.VENDOR_DASHBOARD_TEST_MODE = 'false';

    ({ POST } = await import('../app/api/vendor/dashboard/route.js'));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    savedDocuments.length = 0;
    savedChunks.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (Date.now.mockRestore) {
      Date.now.mockRestore();
    }
  });

  test('persists document and chunks when uploading a PDF', async () => {
    const pdfContent = Buffer.from('First section of the PDF. Second section provides more context.');
    const mockFile = {
      name: 'catalogo.pdf',
      type: 'application/pdf',
      size: pdfContent.length,
      arrayBuffer: async () => pdfContent,
    };

    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const request = {
      url: 'https://example.com/api/vendor/dashboard',
      formData: async () => ({
        get: (key) => {
          switch (key) {
            case 'file':
              return mockFile;
            case 'category':
              return 'products';
            case 'description':
              return 'Manual completo de productos';
            default:
              return null;
          }
        },
      }),
    };

    const response = await POST(request);

    expect(response.body.success).toBe(true);
    expect(savedDocuments).toHaveLength(1);
    expect(savedChunks.length).toBeGreaterThan(0);

    const storedDocument = savedDocuments[0];

    expect(storedDocument.title).toBe('Manual completo de productos');
    expect(storedDocument.content).toContain('First section of the PDF');
    expect(storedDocument.type).toBe('guide');
    expect(storedDocument.fileName).toMatch(/1700000000000_catalogo\.pdf$/);
    expect(storedDocument.metadata).toMatchObject({
      uploadedBy: 'vendor_123',
      source: 'vendor-dashboard',
      description: 'Manual completo de productos',
      originalName: 'catalogo.pdf',
    });

    const chunkCall = savedChunks[0];
    expect(chunkCall.documentId).toBe(storedDocument._id);
    expect(chunkCall.chunkIndex).toBe(0);
    expect(chunkCall.tokenCount).toBeGreaterThan(0);
    expect(chunkCall.startIndex).toBe(0);
    expect(chunkCall.endIndex).toBeGreaterThan(chunkCall.startIndex);
  });
});
