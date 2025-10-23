# Tienda Online – Guía Operativa y Técnica

Esta aplicación Next.js implementa un flujo completo de comercio electrónico con un enfoque especial en la comunicación con clientes y la administración del panel de vendedores. Este documento reúne los puntos clave para configurar el entorno de correo SMTP, consumir los endpoints críticos y reproducir las pruebas manuales requeridas.

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
