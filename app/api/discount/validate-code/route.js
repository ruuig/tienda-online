import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { code, userId } = body

    if (!code) {
      return NextResponse.json({ success: false, message: 'Código de descuento es requerido' })
    }

    // Buscar descuento por código (insensible a mayúsculas/minúsculas)
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true
    })

    if (!discount) {
      return NextResponse.json({ success: false, message: 'Código de descuento no válido' })
    }

    // Verificar fechas de validez
    const now = new Date()
    if (discount.startDate && discount.startDate > now) {
      return NextResponse.json({ success: false, message: 'El código de descuento aún no es válido' })
    }

    if (discount.endDate && discount.endDate < now) {
      return NextResponse.json({ success: false, message: 'El código de descuento ha expirado' })
    }

    // Verificar límite de usos
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ success: false, message: 'El código de descuento ha alcanzado su límite de usos' })
    }

    return NextResponse.json({
      success: true,
      discount: {
        id: discount._id,
        code: discount.code,
        percentage: discount.percentage,
        description: discount.description,
        maxUses: discount.maxUses,
        usedCount: discount.usedCount,
        minPurchase: discount.minPurchase,
        startDate: discount.startDate,
        endDate: discount.endDate,
        applicableProducts: discount.applicableProducts
      }
    })

  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
