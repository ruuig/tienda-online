import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { discountId } = body

    if (!discountId) {
      return NextResponse.json({ success: false, message: 'ID del descuento es requerido' })
    }

    // Buscar y actualizar descuento
    const discount = await Discount.findByIdAndUpdate(
      discountId,
      { $inc: { usedCount: 1 } },
      { new: true }
    )

    if (!discount) {
      return NextResponse.json({ success: false, message: 'Descuento no encontrado' })
    }

    return NextResponse.json({
      success: true,
      message: 'Descuento aplicado exitosamente',
      discount: {
        id: discount._id,
        code: discount.code,
        usedCount: discount.usedCount,
        maxUses: discount.maxUses
      }
    })

  } catch (error) {
    console.error('Error applying discount:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
