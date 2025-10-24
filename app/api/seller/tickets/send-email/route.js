import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import connectDB from '@/config/db'
import Ticket from '@/src/infrastructure/database/models/ticketModel'

export const runtime = 'nodejs'

function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Configuración SMTP incompleta. Verifica SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS')
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })
}

export async function POST(request) {
  try {
    const { ticketId, to, message } = await request.json()

    if (!ticketId || !to || !message) {
      return NextResponse.json({ success: false, message: 'Faltan datos obligatorios' }, { status: 400 })
    }

    await connectDB()

    const ticket = await Ticket.findById(ticketId).lean()
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 })
    }

    const skipSend = request.headers.get('x-test-mode') === 'true'

    const createdAt = new Date()
    const messageEntry = {
      senderType: 'admin',
      senderId: 'soporterjgtechshop@gmail.com',
      content: message,
      type: 'text',
      metadata: {
        channel: 'email',
        sentBy: 'seller-panel'
      },
      createdAt
    }

    if (!skipSend) {
      const transporter = buildTransporter()

      await transporter.sendMail({
        from: `Soporte RJG Tech Shop <${process.env.SMTP_USER}>`,
        to,
        subject: `Respuesta a tu ticket: ${ticket.title}`,
        text: message,
        replyTo: `soporterjgtechshop@gmail.com`
      })
    }

    await Ticket.findByIdAndUpdate(ticketId, {
      $push: {
        messages: messageEntry
      },
      $set: {
        status: ticket.status === 'resolved' ? 'resolved' : 'in_progress',
        updatedAt: createdAt
      }
    })

    return NextResponse.json({ success: true, message: { ...messageEntry, createdAt: createdAt.toISOString() } })
  } catch (error) {
    console.error('Error enviando correo de ticket:', error)
    return NextResponse.json({ success: false, message: error.message || 'Error al enviar el correo' }, { status: 500 })
  }
}
