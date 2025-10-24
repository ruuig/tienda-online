# RAG Chat System - Nueva Implementación

## 🎯 **Visión General**

Este proyecto implementa un sistema de chat inteligente con **RAG (Retrieval-Augmented Generation)** basado en el modelo Python original pero adaptado completamente a Node.js con MongoDB.

## 🚀 **Características Principales**

### **1. Sistema RAG Completo**
- **Búsqueda vectorial** con embeddings de OpenAI
- **Chunking inteligente** de documentos (1200 caracteres)
- **Búsqueda por similitud coseno** para encontrar información relevante
- **Streaming en tiempo real** de respuestas

### **2. Integración con Productos**
- **Búsqueda prioritaria** de productos en la base de datos
- **Contexto automático** de productos relacionados con la consulta
- **Fallback inteligente** a documentos RAG si no hay productos relevantes

### **3. Panel de Administración**
- **Subida de documentos** (PDF, texto) desde el panel seller
- **Gestión de documentos** por vendor
- **Procesamiento automático** con embeddings

## 📁 **Estructura del Proyecto**

```
src/
├── domain/                          # Capa de dominio (Clean Architecture)
│   ├── entities/                    # Entidades de negocio
│   │   ├── Document.js             # Entidad Document
│   │   └── DocumentChunk.js        # Entidad DocumentChunk
│   ├── repositories/               # Interfaces de repositorios
│   │   ├── DocumentRepository.js   # Interface DocumentRepository
│   │   └── VectorRepository.js     # Interface VectorRepository
│   └── services/                   # Interfaces de servicios
│       ├── EmbeddingsService.js    # Interface EmbeddingsService
│       └── LLMService.js           # Interface LLMService
├── application/                    # Capa de aplicación
│   └── useCases/                   # Casos de uso
│       ├── UploadDocumentUseCase.js # Caso de uso para subir documentos
│       └── AskQuestionUseCase.js   # Caso de uso para hacer preguntas
├── infrastructure/                 # Capa de infraestructura
│   ├── database/                   # Implementaciones de base de datos
│   │   ├── MongoDocumentRepository.js # Repositorio MongoDB para documentos
│   │   └── MongoVectorRepository.js   # Repositorio vectorial
│   ├── embeddings/                 # Servicios de embeddings
│   │   └── OpenAIEmbeddingsService.js # OpenAI embeddings
│   └── llm/                        # Servicios de LLM
│       └── OpenAILLMService.js     # OpenAI LLM service
└── interfaces/                     # Capa de interfaces
    └── http/                       # Rutas HTTP
        └── routes/
            ├── ragRoutes.js        # Rutas RAG
            └── chatRoutes.js       # Rutas de chat
```

## 🛠 **Configuración**

### **Variables de Entorno**
```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_uri
```

### **Base de Datos**
El sistema crea automáticamente estas colecciones en MongoDB:
- `rag_documents` - Metadatos de documentos
- `rag_document_chunks` - Chunks de texto
- `rag_document_embeddings` - Embeddings vectoriales

## 📚 **Flujo de Funcionamiento**

### **1. Usuario pregunta por productos de Apple**
```
Usuario: "productos de apple"
↓
1. Buscar en productos DB → Encontrar iPhone, MacBook, etc.
2. Si encuentra productos → Respuesta directa con productos
3. Si no encuentra → Buscar en documentos RAG
4. Si no hay documentos → Respuesta general
```

### **2. Usuario pregunta algo específico**
```
Usuario: "¿Cómo funciona la garantía?"
↓
1. Buscar en productos DB → No relevante
2. Buscar en documentos RAG → Encontrar políticas de garantía
3. Generar respuesta con contexto del documento
```

### **3. Usuario pregunta algo sin contexto**
```
Usuario: "¿Cómo está el clima?"
↓
1. Buscar en productos DB → No relevante
2. Buscar en documentos RAG → No encontrado
3. Respuesta: "No poseo información sobre ese tema en el documento cargado."
```

## 🎮 **Uso del Sistema**

### **Panel de Administración**
1. Ve a `/rag-admin` (requiere autenticación)
2. Sube documentos PDF o texto
3. El sistema procesa automáticamente y crea embeddings
4. Los documentos están disponibles inmediatamente para el chat

### **Chat con RAG**
1. El chat busca primero en productos de la base de datos
2. Si no encuentra, busca en documentos RAG
3. Si no hay información, da respuesta estándar
4. **Streaming en tiempo real** de respuestas

## 🔧 **APIs Disponibles**

### **Document Management**
```
POST /api/rag/documents - Subir documento
GET  /api/rag/documents - Listar documentos
DELETE /api/rag/documents/:id - Eliminar documento
```

### **Chat System**
```
POST /api/chat/stream - Chat con streaming RAG
POST /api/chat/process-message - Chat completo (legacy)
GET  /api/chat/health - Health check del sistema
```

### **Admin Panel**
```
GET /rag-admin - Panel de administración para subir documentos
```

## ⚡ **Optimizaciones Implementadas**

### **Performance**
- **GPT-3.5-turbo** en lugar de GPT-4 (3x más rápido)
- **Embeddings text-embedding-3-small** (más rápidos)
- **Chunking optimizado** (1200 caracteres)
- **Cache de productos** (5 minutos)
- **Búsqueda vectorial eficiente** con MongoDB

### **UX**
- **Streaming en tiempo real** de respuestas
- **Fallback inteligente** entre productos y documentos
- **Mensajes de error claros** y útiles
- **Interfaz moderna** y responsive

## 🧪 **Testing**

### **Pruebas del Sistema**
1. **Subir documento**: PDF con políticas de la tienda
2. **Preguntar sobre políticas**: "¿Cuál es la política de devoluciones?"
3. **Preguntar sobre productos**: "¿Tienen iPhone 15?"
4. **Pregunta sin contexto**: "¿Cómo está el clima?"

### **Ejemplos de Respuestas Esperadas**
- **Con productos**: "¡Claro! Tenemos el iPhone 15 disponible por Q8,999..."
- **Con RAG**: "Según nuestros documentos, la política de devoluciones es..."
- **Sin contexto**: "No poseo información sobre ese tema en el documento cargado."

## 🔒 **Seguridad**

- **Autenticación** requerida para subir documentos
- **Validación** de tipos de archivo (PDF, texto)
- **Límite de tamaño** (10MB por archivo)
- **Control de acceso** por vendor

## 🚀 **Próximos Pasos**

1. **Mejorar procesamiento de PDFs** con extracción de texto real
2. **Implementar WebSockets** para chat en tiempo real
3. **Agregar métricas** de uso y performance
4. **Optimizar embeddings** con modelos más eficientes
5. **Implementar cache** de embeddings para mayor velocidad

## 📞 **Soporte**

Para problemas o preguntas sobre la implementación RAG:
1. Revisa los logs del servidor
2. Verifica la conexión con OpenAI
3. Asegúrate de que MongoDB esté funcionando
4. Revisa el health check: `/api/chat/health`

¡El sistema RAG está listo para proporcionar respuestas inteligentes y contextuales a tus usuarios! 🎉
