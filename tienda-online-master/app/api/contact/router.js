import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos" }), { status: 400 });
    }

    const toList = process.env.CONTACT_TO?.split(",").map(s => s.trim()).filter(Boolean);
    if (!toList?.length) {
      return new Response(JSON.stringify({ ok: false, error: "CONTACT_TO no configurado" }), { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const textBody = `
Nombre: ${name}
Correo: ${email}
Asunto: ${subject}

Mensaje:
${message}
    `;

    const info = await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: toList.join(","),
      subject: `[Soporte] ${subject}`,
      replyTo: `${name} <${email}>`,
      text: textBody,
    });

    return new Response(JSON.stringify({ ok: true, id: info.messageId }), { status: 200 });
  } catch (err) {
    console.error("Error al enviar correo:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}