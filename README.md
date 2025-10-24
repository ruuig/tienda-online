## 🚀 Sistema RAG Inteligente

**NUEVO**: Implementación completa de un sistema RAG (Retrieval-Augmented Generation) basado en el modelo Python original pero adaptado a Node.js con MongoDB.

### **Características del Sistema RAG**

#### **1. Búsqueda Inteligente Multi-Fuente**
- **Primero**: Búsqueda en productos de la base de datos (más rápida)
- **Segundo**: Búsqueda en documentos RAG subidos por vendedores
- **Tercero**: Respuesta general si no hay contexto relevante

#### **2. Procesamiento de Documentos**
- **Formatos soportados**: PDF, texto plano
- **Chunking automático**: Divide documentos en fragmentos de 1200 caracteres
- **Embeddings vectoriales**: OpenAI text-embedding-3-small
- **Búsqueda por similitud**: Coseno similarity para encontrar información relevante

#### **3. Streaming en Tiempo Real**
- **Respuestas inmediatas**: Streaming de tokens desde OpenAI
- **Indicadores visuales**: Muestra cuando se está generando respuesta
- **Fallback automático**: Si falla RAG, usa productos o respuesta general

### **Endpoints RAG**

#### **POST `/api/rag/documents`**
Subir documentos para procesamiento RAG:
```json
{
  "title": "Políticas de la tienda",
  "file": "file.pdf"
}
```

#### **GET `/api/rag/documents`**
Listar documentos disponibles:
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_123",
      "title": "Políticas de la tienda",
      "filename": "politicas.pdf",
      "fileSize": 2048000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### **POST `/api/chat/stream`**
Chat con streaming RAG:
```json
{
  "message": "¿Cuál es la política de devoluciones?",
  "conversationId": "conv_123",
  "vendorId": "vendor_456"
}
```

#### **GET `/api/rag/health`**
Health check del sistema RAG:
```json
{
  "success": true,
  "status": {
    "database": "connected",
    "openai": "configured",
    "collections": {
      "rag_documents": true,
      "rag_document_chunks": true,
      "rag_document_embeddings": true
    },
    "counts": {
      "documents": 5,
      "chunks": 150,
      "embeddings": 150
    }
  },
  "optimizations": {
    "model": "gpt-3.5-turbo",
    "embeddings": "text-embedding-3-small",
    "streaming": "enabled",
    "productIntegration": "enabled"
  }
}
```

### **Panel de Administración RAG**

#### **`/rag-admin`**
- Subir documentos PDF o texto
- Ver documentos procesados
- Gestionar documentos por vendor
- Monitor de estado del sistema

#### **`/rag-demo`**
- Demo completa del sistema RAG
- Chat de prueba con streaming
- Subida de documentos de prueba
- Indicadores de performance en tiempo real

### **Flujo de Funcionamiento**

#### **1. Usuario pregunta por productos**
```
Usuario: "¿Tienen productos de Apple?"
↓
1. Buscar en DB productos → Encontrar iPhone, MacBook, iPad
2. Generar respuesta con contexto de productos
3. Mostrar productos con precios y opciones de compra
```

#### **2. Usuario pregunta por políticas**
```
Usuario: "¿Cómo funciona la garantía?"
↓
1. Buscar en productos → No relevante
2. Buscar en documentos RAG → Encontrar políticas de garantía
3. Generar respuesta con información del documento
4. Mostrar fuente del documento (cita)
```

#### **3. Usuario pregunta sin contexto**
```
Usuario: "¿Cómo está el clima?"
↓
1. Buscar en productos → No relevante
2. Buscar en documentos RAG → No encontrado
3. Respuesta: "No poseo información sobre ese tema en el documento cargado."
```

### **Optimizaciones Implementadas**

#### **Performance**
- **Modelo rápido**: GPT-3.5-turbo (3x más rápido que GPT-4)
- **Embeddings optimizados**: text-embedding-3-small
- **Chunking eficiente**: 1200 caracteres por fragmento
- **Cache inteligente**: 5 minutos para productos, 10 minutos para RAG

#### **UX**
- **Streaming en tiempo real**: Respuestas inmediatas con tokens
- **Indicadores visuales**: Muestra qué tipo de contexto se usó
- **Fallback automático**: Siempre da una respuesta útil
- **Mensajes de error claros**: Explica qué salió mal

## 🚀 Sistema RAG Auto-Configurable

**NUEVO (v1.1)**: El sistema RAG se configura automáticamente al iniciar el servidor. ¡No necesitas ejecutar comandos manuales!

### **🔧 Configuración Automática**

#### **Modo Demo (Sin MongoDB)**
- ✅ **Funciona inmediatamente** sin configuración
- ✅ **UI completa** con funcionalidades simuladas
- ✅ **Perfecto para desarrollo** y testing
- ✅ **Todas las páginas disponibles** desde el primer momento

#### **Modo Normal (Con MongoDB)**
- ✅ **Auto-detección** de MongoDB al iniciar
- ✅ **Auto-creación** de colecciones e índices
- ✅ **Procesamiento real** de documentos con embeddings
- ✅ **Búsqueda semántica** y persistencia completa

### **🎯 Cómo Funciona la Auto-Configuración:**

1. **Inicias el servidor:**
   ```bash
   npm run dev
   ```

2. **El sistema verifica automáticamente:**
   - ¿MongoDB configurado? → **Modo Normal** (completo)
   - ¿Sin MongoDB? → **Modo Demo** (simulado)

3. **Si hay MongoDB:**
   - ✅ Crea colecciones `rag_documents`, `rag_document_chunks`, `rag_document_embeddings`
   - ✅ Configura índices optimizados para búsquedas
   - ✅ Activa embeddings reales con OpenAI
   - ✅ Permite búsqueda semántica y persistencia

4. **Si no hay MongoDB:**
   - ✅ Usa respuestas simuladas inteligentes
   - ✅ Mantiene toda la funcionalidad de UI
   - ✅ Perfecto para desarrollo y testing

### **📊 Logs que Verás:**

**Con MongoDB:**
```
✅ MongoDB connected successfully
📁 Colección rag_documents creada automáticamente
  ✅ Índice ownerId_idx creado
  ✅ Índice createdAt_idx creado
📁 Colección rag_document_chunks creada automáticamente
  ✅ Índice documentId_idx creado
✅ Sistema RAG auto-configurado
🎉 Sistema RAG listo y configurado automáticamente!
```

**Sin MongoDB:**
```
✅ MongoDB connected successfully
⚠️ No se pudo configurar automáticamente el sistema RAG: Error de conexión
💡 Puedes ejecutar "npm run rag:setup" manualmente si es necesario
```

### **🔄 Cambiar entre Modos:**

#### **Para usar Modo Normal:**
```bash
# Solo configura MongoDB en .env
echo "MONGODB_URI=your_mongodb_connection_string" >> .env
npm run dev  # ✅ Auto-configura todo automáticamente
```

#### **Para usar Modo Demo:**
```bash
# Solo quita o comenta MONGODB_URI en .env
# npm run dev  # ✅ Funciona en modo demo automáticamente
```

### **📋 Scripts Disponibles (Opcionales):**

| Comando | Propósito | ¿Necesario? |
|---------|-----------|-------------|
| `npm run rag:setup` | Configuración manual | ❌ **Opcional** (auto-setup) |
| `npm run rag:health` | Verificar estado | ✅ **Recomendado** |
| `npm run rag:test` | Probar sistema | ✅ **Recomendado** |

### **🎮 Para Probar Ahora:**

1. **Panel de documentos**: `http://localhost:3000/seller/documents`
2. **Health check**: `npm run rag:health`
3. **Chat con RAG**: `http://localhost:3000/chat`

**¡Todo funciona automáticamente sin configuración adicional!** 🎉

```
src/
├── domain/                    # Clean Architecture
│   ├── entities/             # Document, DocumentChunk
│   ├── repositories/         # Interfaces de repositorios
│   └── services/             # Interfaces de servicios
├── application/              # Casos de uso
│   └── useCases/             # UploadDocumentUseCase, AskQuestionUseCase
├── infrastructure/           # Implementaciones técnicas
│   ├── database/             # MongoDB repositories
│   ├── embeddings/           # OpenAI embeddings
│   └── llm/                  # OpenAI LLM
└── interfaces/               # HTTP routes
    └── http/routes/          # API endpoints
```

### **Testing del Sistema RAG**

#### **Pruebas Funcionales**
1. **Subir documento PDF** con políticas de la tienda
2. **Preguntar sobre políticas**: "¿Política de devoluciones?"
3. **Preguntar sobre productos**: "¿Tienen iPhone 15?"
4. **Pregunta sin contexto**: "¿Cómo está el clima?"

#### **Pruebas de Performance**
- **Tiempo de respuesta**: < 2 segundos
- **Streaming**: Respuestas en tiempo real
- **Fallback**: Siempre responde algo útil
- **Health check**: `/api/rag/health` debe retornar status OK

### **Referencias RAG**

- **Documentación completa**: `RAG_SYSTEM_README.md`
- **Código principal**: `src/application/useCases/AskQuestionUseCase.js`
- **Panel admin**: `app/rag-admin/page.js`
- **Demo completa**: `app/rag-demo/page.js`

---

## Endpoints relevantes

### POST `/api/contact`
Envía el formulario de contacto hacia los responsables de soporte.
- **Body (JSON)**: `{ name, email, subject, message }` (todos obligatorios).
- **Respuesta (200)**: `{ ok: true, id: <messageId> }` cuando el correo se encola correctamente.
- **Errores**:
  - `400` cuando faltan campos en el payload.
  - `500` si `CONTACT_TO` o las credenciales SMTP no están configuradas.
- **Notas**:
  - El encabezado `replyTo` utiliza el correo del cliente para facilitar la respuesta directa desde la bandeja de soporte.
  - Puede ejecutarse en *modo prueba* (sin servidor SMTP real) habilitando `SMTP_TEST_MODE=true`.

### GET `/api/vendor/dashboard`
Entrega información agregada del panel de vendedor. El parámetro `section` controla el bloque devuelto:
- `overview`: métricas generales (documentos indexados, conversaciones, satisfacción).
- `documents`: listado paginado de documentos cargados.
- `conversations`: historial de sesiones con clientes.
- `analytics`: evolución de conversaciones, mensajes y *intents*.
- `settings`: configuración de prompts y estado del sistema RAG.

Cuando `VENDOR_DASHBOARD_TEST_MODE=true` el endpoint responde con datos estáticos sin tocar la base de datos, ideal para validaciones locales o CI.

### POST `/api/vendor/dashboard`
Gestiona la subida de documentos PDF asociados al vendedor (utilizados por el motor RAG).
- **Body (form-data)**: campos `file` (PDF ≤10 MB), `category` y `description` (opcional).
- **Respuesta (200)**: confirmación de carga junto con metadatos del documento.
- **Validaciones**: rechaza archivos vacíos, tipos distintos a PDF y tamaños superiores a 10 MB.
- **Modo prueba**: con `VENDOR_DASHBOARD_TEST_MODE=true` el endpoint omite la persistencia real y devuelve un payload simulado.

## Configuración SMTP

| Variable | Descripción |
| --- | --- |
| `CONTACT_TO` | Lista separada por comas con los destinatarios del formulario de contacto. |
| `SMTP_HOST` / `SMTP_PORT` | Host y puerto del servidor SMTP. Por defecto el puerto es `587`. |
| `SMTP_USER` / `SMTP_PASS` | Credenciales utilizadas para autenticarse y definir el remitente base. |
| `SMTP_SECURE` | Establecer a `true` para conexiones SMTPS (TLS implícito). |
| `SMTP_IGNORE_TLS` | Establecer a `true` para omitir la validación TLS (p. ej. servidores de prueba). |
| `SMTP_FROM` | Remitente explícito. Si se omite se usa `"<Nombre Cliente>" <SMTP_USER>`. |
| `SMTP_TEST_MODE` | Activa el transporte en memoria de Nodemailer (sin enviar correos reales). |
| `SMTP_TEST_MODULE_PATH` | Ruta opcional a un módulo que exporte un reemplazo de Nodemailer (útil en pruebas locales). |

El helper `sendContactEmail` valida que `CONTACT_TO`, `SMTP_USER` y `SMTP_PASS` estén presentes cuando no se ejecuta en modo prueba. También expone la lista final de destinatarios y el `replyTo` configurado, lo cual simplifica cualquier auditoría del flujo.

## Flujo de trabajo del panel de vendedores

1. **Carga de documentos** (`POST /api/vendor/dashboard`): recibe PDFs, crea versiones en disco y genera *chunks* para el motor RAG. En modo prueba se omite la escritura y se retornan IDs simulados.
2. **Consulta del panel** (`GET /api/vendor/dashboard`): entrega las distintas secciones (overview, documents, conversations, analytics, settings). El modo prueba devuelve datos representativos para UI sin depender de MongoDB ni OpenAI.
3. **Persistencia**: en entorno real la API se conecta a MongoDB (`connectDB`) y utiliza los modelos `Document`, `DocumentChunk`, `Conversation`, `Message` y `PromptConfig`.

## Pruebas manuales ejecutadas

Se añadieron *stubs* autocontenidos en `scripts/test-modules` que reemplazan dependencias externas (Nodemailer, NextResponse, pdf-parse) cuando las variables `*_TEST_MODULE_PATH` están presentes. Esto permite ejecutar las validaciones manuales sin acceso a servicios externos.

```bash
NODE_PATH=./scripts/test-modules node scripts/manual-tests.mjs
```

El script cubre:
- **Contacto**: envío exitoso, validación de `CONTACT_TO` obligatorio y confirmación del `replyTo` del cliente.
- **Seller dashboard**: lectura de secciones `overview` y `documents`, subida de PDF en modo prueba y validación de archivos inválidos.

La salida generada confirma el estado `200`/`400` esperado para cada caso y finaliza con `✅ Pruebas manuales completadas satisfactoriamente`.

## Variables de prueba para el panel seller

| Variable | Uso |
| --- | --- |
| `VENDOR_DASHBOARD_TEST_MODE` | Activa las respuestas simuladas en GET y POST. |
| `NEXT_SERVER_TEST_MODULE_PATH` | Permite inyectar un sustituto de `NextResponse` al ejecutar pruebas fuera de Next.js. |
| `PDF_PARSE_TEST_MODULE_PATH` | Inyecta un parser ligero de PDF durante las pruebas. |

Cuando se despliega en un entorno real, basta con omitir estas variables y proporcionar las credenciales reales de MongoDB/OpenAI.

## Referencias adicionales

- Código de envío de correos: `src/infrastructure/contact/sendContactEmail.js`.
- Ruta de contacto: `app/api/contact/route.js`.
- Panel del vendedor: `app/api/vendor/dashboard/route.js` y páginas en `app/seller/`.
- Script de pruebas manuales: `scripts/manual-tests.mjs`.

Con esta guía se puede replicar el flujo de contacto y administración de vendedores, verificar los correos SMTP y comprender la configuración necesaria para operar el sistema en distintos entornos.
