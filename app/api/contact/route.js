import nodemailer from "nodemailer";
import connectDB from '@/config/db';
import { TicketRepositoryImpl } from '@/src/infrastructure/database/repositories';

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

    await connectDB();
    const ticketRepository = new TicketRepositoryImpl();

    const ticket = await ticketRepository.create({
      conversationId: null,
      userId: email,
      title: subject,
      description: message,
      category: 'other',
      priority: 'medium',
      status: 'open',
      messages: [{
        sender: 'customer',
        senderName: name,
        senderEmail: email,
        content: message,
        sentAt: new Date()
      }],
      metadata: {
        source: 'contact_form',
        channel: 'web',
        senderName: name,
        senderEmail: email,
        subject
      }
    });

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

    return new Response(JSON.stringify({ ok: true, message: "Mensaje enviado correctamente", ticketId: ticket._id.toString(), emailId: info.messageId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error("Error al enviar correo:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}