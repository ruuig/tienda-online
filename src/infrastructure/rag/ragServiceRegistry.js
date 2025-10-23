import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories.js';
import { RAGService } from './ragService.js';

let sharedService = null;

export function getSharedRAGService() {
  if (!sharedService) {
    const documentRepository = new DocumentRepositoryImpl();
    sharedService = new RAGService(documentRepository);
  }
  return sharedService;
}

export function resetSharedRAGService() {
  sharedService = null;
}
