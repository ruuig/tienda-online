# 🧪 Pruebas del Sistema RAG

## 🚀 Endpoints Disponibles para Probar

### 1. **Health Check** - Verificar estado del sistema
```bash
curl http://localhost:3001/api/rag/health
# o
curl http://localhost:3001/api/rag/health | jq .
```

### 2. **Status Simple** - Verificar si está operativo
```bash
curl http://localhost:3001/api/rag/status
# o
curl http://localhost:3001/api/rag/status | jq .
```

**Respuesta esperada:**
```json
{
  "isWorking": true,
  "status": {
    "system": "ready",
    "database": "connected",
    "openai": "configured",
    "documents": 2,
    "chunks": 15
  }
}
```

### 3. **Test Completo** - Probar todas las funcionalidades
```bash
curl http://localhost:3001/api/rag/test
# o
curl http://localhost:3001/api/rag/test | jq .
```

### 4. **Listar Documentos** - Ver documentos disponibles
```bash
curl http://localhost:3001/api/rag/documents
# o
curl http://localhost:3001/api/rag/documents | jq .
```

### 5. **Probar Chat con RAG** - Chat con búsqueda semántica
```bash
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿qué información tienes?"}'
```

## 🖥️ Scripts de Prueba Automatizados

### Para Linux/Mac:
```bash
./test-rag.sh
```

### Para Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File test-rag.ps1
```

## 🌐 Pruebas en el Navegador

1. **Panel de Documentos:**
   ```
   http://localhost:3001/seller/documents
   ```

2. **Chat con RAG:**
   ```
   http://localhost:3001/chat
   ```

## 🔍 Qué Verificar

### ✅ **El sistema está funcionando si:**

1. **Health Check** devuelve:
   - `database: "connected"`
   - `openai: "configured"`
   - `counts.documents > 0`

2. **Test completo** devuelve:
   - `tests.embeddings.success: true`
   - `tests.search.success: true`
   - `tests.documents.count > 0`

3. **Chat responde** usando información de documentos subidos

### ❌ **Problemas comunes:**

1. **Error 403**: Verificar permisos (debe ser usuario 'seller' o 'admin')
2. **Error 500**: Verificar que MongoDB esté conectado
3. **Sin embeddings**: Verificar OPENAI_API_KEY
4. **Sin documentos**: Subir documentos en el panel seller

## 📊 Logs del Servidor

Para ver logs detallados del sistema RAG, revisa la consola del servidor donde aparecen mensajes como:
- `🔄 Construyendo índice RAG con X documentos...`
- `✅ X chunks guardados en base de datos`
- `✅ Índice RAG construido. Total chunks: X`

## 🛠️ Comandos de Debug

```bash
# Verificar conexión MongoDB
curl http://localhost:3001/api/rag/health | jq .status.database

# Verificar OpenAI
curl http://localhost:3001/api/rag/test | jq .tests.embeddings

# Verificar documentos
curl http://localhost:3001/api/rag/documents | jq .documents

# Probar búsqueda
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "buscar información sobre productos"}'
```
