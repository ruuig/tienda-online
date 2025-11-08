// src/application/useCases/UploadDocumentUseCase.js
import { v4 as uuidv4 } from 'uuid';

export class UploadDocumentUseCase {
  constructor(documentRepository, vectorRepository, embeddingsService) {
    this.documentRepository = documentRepository;
    this.vectorRepository = vectorRepository;
    this.embeddingsService = embeddingsService;
  }

  /**
   * Chunk text into smaller pieces
   * @param {string} text - Text to chunk
   * @param {number} maxChars - Maximum characters per chunk
   * @returns {Array} - Array of chunks
   */
  chunkText(text, maxChars = 1200) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) continue;

      if ((currentChunk + trimmedSentence).length > maxChars && currentChunk) {
        chunks.push({
          chunk_index: chunks.length,
          content: currentChunk.trim()
        });
        currentChunk = trimmedSentence + '. ';
      } else {
        currentChunk += trimmedSentence + '. ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        chunk_index: chunks.length,
        content: currentChunk.trim()
      });
    }

    return chunks;
  }

  /**
   * Execute document upload and processing
   * @param {Object} options - Options object
   * @param {string} options.title - Document title
   * @param {string} options.filename - Original filename
   * @param {string} options.mimeType - MIME type
   * @param {Buffer} options.fileBytes - File content
   * @param {string} options.ownerId - Owner ID (vendor ID)
   * @returns {Promise<string>} - Document ID
   */
  async execute({ title, filename, mimeType, fileBytes, ownerId }) {
    try {
      console.log(`Processing document: ${title} (${filename})`);

      // 1. Save document
      const documentId = await this.documentRepository.saveDocument({
        title,
        filename,
        mimeType,
        fileBytes,
        ownerId
      });

      console.log(`Document saved with ID: ${documentId}`);

      // 2. Extract text from PDF (simplified for now - just use filename as content)
      // TODO: Implement PDF text extraction like the Python version
      let text = '';
      if (mimeType === 'application/pdf') {
        // For now, we'll use a placeholder
        // In the Python version, they use pdfminer.high_level.extract_text
        text = `Document: ${title}\nFile: ${filename}\nContent extracted from PDF.`;
      } else {
        // For text files or other formats
        text = fileBytes.toString('utf-8');
      }

      // 3. Chunk the text
      const chunks = this.chunkText(text);
      console.log(`Created ${chunks.length} chunks`);

      // 4. Add chunks to document
      await this.documentRepository.addChunks(documentId, chunks);

      // 5. Generate embeddings
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddingsService.embed(texts);

      // 6. Get chunk IDs (this should return the actual IDs from addChunks)
      const chunkIds = await this.documentRepository.addChunks(documentId, chunks);

      // 7. Upsert embeddings
      const pairs = chunkIds.map((chunkId, index) => [chunkId, embeddings[index]]);
      await this.vectorRepository.upsertEmbeddings(pairs);

      console.log(`Document processing completed for: ${title}`);
      return documentId;

    } catch (error) {
      console.error('Error in UploadDocumentUseCase:', error);
      throw error;
    }
  }
}
