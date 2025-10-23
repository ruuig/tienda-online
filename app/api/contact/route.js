import { ContactConfigurationError, sendContactEmail } from '../../../src/infrastructure/contact/sendContactEmail.js';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { info } = await sendContactEmail({ name, email, subject, message });

    return new Response(JSON.stringify({ ok: true, id: info.messageId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    if (err instanceof ContactConfigurationError) {
      return new Response(
        JSON.stringify({ ok: false, error: err.message }),
        { status: err.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error("Error al enviar correo:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}