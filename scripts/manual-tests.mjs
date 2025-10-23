import Module from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const customModulePath = resolve(__dirname, './test-modules');
process.env.NODE_PATH = [customModulePath, process.env.NODE_PATH].filter(Boolean).join(':');
Module._initPaths();

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function runContactFlowTests() {
  logSection('Pruebas flujo de contacto');
  const payload = {
    name: 'Cliente Demo',
    email: 'cliente@example.com',
    subject: 'Consulta de producto',
    message: '¿Tienen disponibilidad del modelo XYZ?'
  };

  const contactEnv = {
    ...process.env,
    CONTACT_TO: 'soporte@example.com,ventas@example.com',
    SMTP_TEST_MODE: 'true',
    SMTP_USER: 'noreply@example.com',
    SMTP_PASS: 'super-secret',
    SMTP_HOST: 'smtp.example.com',
    SMTP_TEST_MODULE_PATH: new URL('./test-modules/nodemailer/index.js', import.meta.url).href,
  };

  const contactModule = await import('../src/infrastructure/contact/sendContactEmail.js');
  const { sendContactEmail, ContactConfigurationError } = contactModule;

  const sendResult = await sendContactEmail(payload, contactEnv);
  console.log('✔ Envío simulado completado');
  console.log('  ID de mensaje:', sendResult.info.messageId);
  console.log('  Reply-To configurado como:', sendResult.mailOptions.replyTo);
  console.log('  Destinatarios:', sendResult.toList.join(', '));

  try {
    await sendContactEmail(payload, { ...contactEnv, CONTACT_TO: '' });
  } catch (error) {
    if (error instanceof ContactConfigurationError) {
      console.log('✔ Validación CONTACT_TO sin configurar:', error.message);
    } else {
      throw error;
    }
  }

  process.env.CONTACT_TO = contactEnv.CONTACT_TO;
  process.env.SMTP_TEST_MODE = contactEnv.SMTP_TEST_MODE;
  process.env.SMTP_USER = contactEnv.SMTP_USER;
  process.env.SMTP_PASS = contactEnv.SMTP_PASS;
  process.env.SMTP_HOST = contactEnv.SMTP_HOST;
  process.env.SMTP_TEST_MODULE_PATH = contactEnv.SMTP_TEST_MODULE_PATH;

  const { POST: contactPost } = await import('../app/api/contact/route.js');

  const contactRequest = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contactResponse = await contactPost(contactRequest);
  const contactJson = await contactResponse.json();
  console.log('✔ Endpoint /api/contact responde', contactResponse.status, contactJson);

  delete process.env.CONTACT_TO;
  const failingRequest = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const failingResponse = await contactPost(failingRequest);
  const failingJson = await failingResponse.json();
  console.log('✔ Validación de error cuando falta CONTACT_TO:', failingResponse.status, failingJson.error);
}

async function runSellerManagementTests() {
  logSection('Pruebas gestión seller');
  process.env.VENDOR_DASHBOARD_TEST_MODE = 'true';
  process.env.NEXT_SERVER_TEST_MODULE_PATH = new URL('./test-modules/node_modules/next/server.js', import.meta.url).href;
  process.env.PDF_PARSE_TEST_MODULE_PATH = new URL('./test-modules/node_modules/pdf-parse/index.js', import.meta.url).href;

  const { GET: vendorGet, POST: vendorPost } = await import('../app/api/vendor/dashboard/route.js');

  const overviewResponse = await vendorGet(new Request('http://localhost/api/vendor/dashboard?section=overview'));
  const overviewJson = await overviewResponse.json();
  console.log('✔ Sección overview:', overviewResponse.status, overviewJson.section, overviewJson.data?.totals);

  const documentsResponse = await vendorGet(new Request('http://localhost/api/vendor/dashboard?section=documents'));
  const documentsJson = await documentsResponse.json();
  console.log('✔ Sección documents:', documentsResponse.status, documentsJson.section, documentsJson.data?.items?.length);

  const formData = new FormData();
  const pdfContent = Buffer.from('%PDF-1.4\n% Mock PDF');
  const pdfFile = new File([pdfContent], 'manual.pdf', { type: 'application/pdf' });
  formData.set('file', pdfFile);
  formData.set('category', 'documentacion');
  formData.set('description', 'Manual de producto demo');

  const uploadResponse = await vendorPost(new Request('http://localhost/api/vendor/dashboard', {
    method: 'POST',
    body: formData,
  }));
  const uploadJson = await uploadResponse.json();
  console.log('✔ Subida en modo prueba:', uploadResponse.status, uploadJson.document);

  const invalidForm = new FormData();
  invalidForm.set('file', new File([Buffer.from('texto')], 'not-pdf.txt', { type: 'text/plain' }));
  invalidForm.set('category', 'documentacion');
  const invalidResponse = await vendorPost(new Request('http://localhost/api/vendor/dashboard', {
    method: 'POST',
    body: invalidForm,
  }));
  const invalidJson = await invalidResponse.json();
  console.log('✔ Validación tipo de archivo:', invalidResponse.status, invalidJson.message);
}

async function main() {
  await runContactFlowTests();
  await runSellerManagementTests();
  console.log('\n✅ Pruebas manuales completadas satisfactoriamente');
}

main().catch((error) => {
  console.error('\n❌ Error durante las pruebas manuales:', error);
  process.exitCode = 1;
});
