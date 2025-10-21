# Contexto de Productos en el Chat

Este documento describe la nueva funcionalidad de contexto de productos que permite al chat de soporte tener conocimiento completo del catálogo de productos de la tienda.

## 🎯 Funcionalidades Implementadas

### 1. **Contexto Dinámico de Productos**
- El chat ahora tiene conocimiento completo de todos los productos disponibles
- Información actualizada en tiempo real desde la base de datos
- Contexto incluye: nombres, descripciones, categorías, precios, características

### 2. **Búsqueda Inteligente de Productos**
- Búsqueda semántica usando el sistema RAG existente
- Los usuarios pueden preguntar por productos específicos
- El chat puede sugerir productos similares si no encuentra exactamente lo solicitado

### 3. **Preguntas Frecuentes Dinámicas**
- Las preguntas frecuentes se generan automáticamente basadas en los productos disponibles
- Incluye preguntas sobre categorías específicas de productos
- Rango de precios dinámico basado en el catálogo real

## 🏗️ Arquitectura

### Componentes Principales

1. **`ProductContextService`** (`src/services/productContextService.js`)
   - Servicio principal que maneja el contexto de productos
   - Convierte productos en documentos para el sistema RAG
   - Proporciona funciones de búsqueda y generación de contexto

2. **`useProductContext`** (`src/hooks/useProductContext.js`)
   - Hook personalizado para usar el contexto en componentes React
   - Maneja la inicialización y estado del contexto

3. **ChatService Mejorado** (`src/infrastructure/openai/chatService.js`)
   - Modificado para aceptar contexto dinámico de productos
   - Genera respuestas basadas en información real de productos

4. **API de Chat Actualizada** (`app/api/chat/process-message/route.js`)
   - Obtiene productos automáticamente para cada consulta
   - Pasa contexto de productos al servicio de OpenAI

## 🚀 Cómo Funciona

### Flujo de Funcionamiento

1. **Inicialización**: Cuando se carga el chat, el `useProductContext` obtiene todos los productos
2. **Conversión RAG**: Los productos se convierten en documentos para el sistema RAG
3. **Consulta del Usuario**: El mensaje se envía a la API con contexto de productos
4. **Generación de Respuesta**: OpenAI genera respuestas usando el contexto real de productos

### Ejemplos de Consultas que Ahora Funcionan

✅ **"¿Tienen iPhone 15?"**
- El chat buscará productos que contengan "iPhone" o "15"
- Proporcionará información específica si existe
- Sugerirá alternativas si no está disponible

✅ **"¿Cuáles son sus productos más baratos?"**
- El chat analizará el rango de precios
- Sugerirá productos dentro del presupuesto
- Proporcionará información detallada

✅ **"¿Tienen laptops para trabajo?"**
- Buscará en la categoría de laptops
- Filtrará por características relevantes
- Proporcionará opciones específicas

## 🧪 Pruebas

Para probar la funcionalidad:

```bash
# Ejecutar prueba del contexto de productos
node scripts/testProductContext.js
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

Asegúrate de tener configuradas:
- `OPENAI_API_KEY`: Clave de API de OpenAI
- `NEXTAUTH_URL`: URL de la aplicación (para desarrollo: `http://localhost:3000`)

### Dependencias

El sistema utiliza las siguientes dependencias existentes:
- Sistema RAG ya implementado
- Contexto de productos existente
- OpenAI integration
- Base de datos MongoDB

## 📊 Métricas y Monitoreo

El sistema incluye métricas automáticas:
- Número de productos en contexto
- Categorías disponibles
- Tiempo de procesamiento
- Uso del contexto de productos (sí/no)
- Número de productos encontrados por consulta

## 🔧 Mantenimiento

### Actualización Automática
El contexto se actualiza automáticamente cuando:
- Se cargan nuevos productos en la base de datos
- El chat se inicializa
- Los productos cambian

### Cache
- Los productos se cachean por 5 minutos en la API
- El contexto RAG se reconstruye solo cuando cambian los productos

## 🚨 Solución de Problemas

### Problemas Comunes

1. **"No se encuentran productos"**
   - Verifica que haya productos en la base de datos
   - Ejecuta `node scripts/testProductContext.js` para diagnosticar

2. **"Error de contexto"**
   - Verifica la conexión a la base de datos
   - Revisa los logs del servidor

3. **Respuestas genéricas**
   - Asegúrate de que OpenAI API Key esté configurada
   - Verifica que el sistema RAG esté funcionando

### Logs de Depuración

El sistema incluye logs detallados:
```
🚀 Inicializando servicio de contexto de productos...
✅ Contexto de productos inicializado con X productos
🔍 Probando búsqueda de productos...
✅ Encontrados X productos relevantes
📝 Probando generación de contexto...
```

## 🎉 Beneficios

### Para los Usuarios
- Respuestas más precisas y útiles
- Información actualizada en tiempo real
- Sugerencias personalizadas basadas en el catálogo

### Para el Negocio
- Reducción de consultas repetitivas
- Mejor experiencia de usuario
- Aumento en conversiones por información precisa

### Para el Desarrollo
- Código modular y reutilizable
- Fácil mantenimiento y extensión
- Integración con sistemas existentes

## 📈 Próximas Mejoras

1. **Análisis de Sentimientos**: Detectar si el usuario está satisfecho
2. **Recomendaciones Personalizadas**: Basadas en historial de navegación
3. **Integración con Carrito**: Sugerir agregar productos directamente
4. **Análisis de Conversaciones**: Mejorar respuestas basadas en patrones
