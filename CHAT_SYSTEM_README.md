# 🚀 Configuración del Sistema de Chat con IA

## 📋 Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017

# Autenticación con Clerk (ya configurado)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clave_publica_de_clerk
CLERK_SECRET_KEY=tu_clave_secreta_de_clerk

# API de OpenAI (OBLIGATORIA para el chatbot)
OPENAI_API_KEY=sk-tu-clave-de-openai-aqui

# Configuración adicional (opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🔑 Obtener Clave de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión con tu cuenta
3. Ve a "API Keys" en el menú lateral
4. Crea una nueva clave secreta
5. Copia la clave y agrégala a tu archivo `.env`

## 🗄️ Configuración de Base de Datos

### MongoDB Local
```bash
# Instalar MongoDB Community Edition
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
sudo apt install mongodb

# Iniciar MongoDB
mongod
```

### MongoDB Atlas (Nube)
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un cluster gratuito
3. Obtén la cadena de conexión
4. Reemplaza `MONGODB_URI` en tu `.env`

## 🚀 Inicialización del Sistema

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia `.env.example` a `.env` y configura las claves necesarias.

### 3. Inicializar base de datos
```bash
# Crear documentos de prueba para RAG
node scripts/initDatabase.js
```

### 4. Construir índice RAG
```bash
# Indexar documentos para búsqueda inteligente
node scripts/rebuildRAGIndex.js
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

## 🎯 Funcionalidades Implementadas

### ✅ Chat en Tiempo Real
- Comunicación WebSocket bidireccional
- Indicadores de escritura en tiempo real
- Estados de lectura sincronizados

### ✅ Chatbot Inteligente
- GPT-4 integrado para respuestas automáticas
- Clasificación automática de intenciones
- Contexto de conversación mantenido

### ✅ Sistema RAG
- Consulta de documentos internos (FAQs, políticas, guías)
- Búsqueda semántica en contenido
- Respuestas contextuales basadas en documentos

### ✅ Panel de Administración
- Gestión completa de conversaciones
- Sistema de tickets de soporte
- Analítica básica de uso
- Gestión de documentos RAG

## 📱 Uso del Chat

### Para Usuarios
1. El botón de chat aparece en todas las páginas
2. Haz clic para abrir la ventana de chat
3. Escribe tu consulta y recibe respuesta automática
4. Si necesitas ayuda humana, se crea un ticket automáticamente

### Para Administradores
1. Accede al panel de admin en `/admin`
2. Ve a "Conversaciones" para supervisar chats activos
3. Gestiona tickets en "Tickets"
4. Agrega documentos en "Documentos RAG"

## 🔧 Comandos Útiles

```bash
# Inicializar base de datos con datos de prueba
node scripts/initDatabase.js

# Reconstruir índice RAG
node scripts/rebuildRAGIndex.js

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 🐛 Solución de Problemas

### Error: "OpenAI API key is required"
- Verifica que `OPENAI_API_KEY` esté configurada en `.env`
- Asegúrate de que la clave sea válida y tenga créditos

### Error: "MongoDB connection failed"
- Verifica que `MONGODB_URI` esté correcta
- Asegúrate de que MongoDB esté corriendo
- Para Atlas, verifica permisos de red

### Error: "WebSocket connection failed"
- Verifica que el servidor esté corriendo en puerto 3000
- Asegúrate de que no haya problemas de CORS

## 📚 Próximos Pasos

1. **Configurar producción**: Variables de entorno en hosting
2. **Agregar más documentos RAG**: Políticas, FAQs específicas
3. **Personalizar respuestas**: Ajustar prompts de OpenAI
4. **Agregar más idiomas**: Soporte multilenguaje
5. **Integrar análisis avanzado**: Métricas detalladas

## 💬 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Consulta la documentación de OpenAI y MongoDB
4. Crea un issue en el repositorio
