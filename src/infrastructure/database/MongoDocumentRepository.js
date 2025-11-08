// src/infrastructure/database/MongoDocumentRepository.js
import { DocumentRepository } from '../../domain/repositories/DocumentRepository.js';
import mongoose from 'mongoose';
import { Document } from '../../domain/entities/Document.js';
import { v4 as uuidv4 } from 'uuid';

export class MongoDocumentRepository extends DocumentRepository {
  constructor() {
    super();
    this.collectionName = 'rag_documents';
  }

  async saveDocument({ title, filename, mimeType, fileBytes, ownerId }) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection(this.collectionName);
      const documentId = uuidv4();

      const documentData = {
        _id: documentId,
        title,
        filename,
        mimeType,
        fileSize: fileBytes.length,
        fileData: fileBytes, // Guardar como Buffer
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await collection.insertOne(documentData);
      return documentId;

    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async addChunks(documentId, chunks) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection('rag_document_chunks');

      const chunkDocuments = chunks.map(chunk => ({
        documentId,
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        createdAt: new Date()
      }));

      const result = await collection.insertMany(chunkDocuments);
      return Object.values(result.insertedIds);

    } catch (error) {
      console.error('Error adding chunks:', error);
      throw error;
    }
  }

  async getDocument(documentId) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection(this.collectionName);
      const document = await collection.findOne({ _id: documentId });

      if (!document) {
        throw new Error('Document not found');
      }

      return Document.fromDatabaseRow(document);

    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async getDocumentsByVendor(vendorId) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection(this.collectionName);
      const documents = await collection.find({ ownerId: vendorId }).toArray();
      return documents.map(doc => Document.fromDatabaseRow(doc));

    } catch (error) {
      console.error('Error getting documents by vendor:', error);
      throw error;
    }
  }
}
