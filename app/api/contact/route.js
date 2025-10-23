import { sendSmtpMail } from "@/lib/mail/smtpClient";
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const toList = process.env.CONTACT_TO?.split(",").map(s => s.trim()).filter(Boolean);
    if (!toList?.length) {
      return new Response(JSON.stringify({ ok: false, error: "CONTACT_TO no configurado" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const textBody = `
Nombre: ${name}
Correo: ${email}
Asunto: ${subject}

Mensaje:
${message}
    `;

    const info = await sendSmtpMail({
      fromName: name,
      to: toList,
      subject: `[Soporte] ${subject}`,
      replyTo: `${name} <${email}>`,
      text: textBody,
    });

    return new Response(JSON.stringify({ ok: true, id: info.messageId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error("Error al enviar correo:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}