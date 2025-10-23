import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { code, percentage, description, startDate, endDate, maxUses, applicableProducts, minPurchase, userId } = body

    // Validaciones básicas
    if (!code || !percentage || !userId) {
      return NextResponse.json({ success: false, message: 'Código, porcentaje y usuario son requeridos' })
    }

    if (percentage < 0 || percentage > 100) {
      return NextResponse.json({ success: false, message: 'El porcentaje debe estar entre 0 y 100' })
    }

    // Verificar que el código no exista ya
    const existingDiscount = await Discount.findOne({ code: code.toUpperCase() })
    if (existingDiscount) {
      return NextResponse.json({ success: false, message: 'Ya existe un código de descuento con ese nombre' })
    }

    // Crear nuevo descuento
    const discountData = {
      code: code.toUpperCase(),
      percentage,
      description,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxUses: maxUses || undefined,
      applicableProducts: applicableProducts || [],
      minPurchase: minPurchase || 0,
      date: Date.now()
    }

    const discount = await Discount.create(discountData)

    return NextResponse.json({
      success: true,
      message: 'Código de descuento creado exitosamente',
      discount
    })

  } catch (error) {
    console.error('Error creating discount:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
