import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { code, userId, productIds = [], cartTotal = 0 } = body

    if (!code) {
      return NextResponse.json({ success: false, message: 'Código de descuento es requerido' })
    }

    // Buscar descuento por código (insensible a mayúsculas/minúsculas)
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true
    })

    if (!discount) {
      return NextResponse.json({ success: false, message: 'Código de descuento no válido o expirado' })
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

    // Verificar mínimo de compra
    if (discount.minPurchase && cartTotal < discount.minPurchase) {
      return NextResponse.json({
        success: false,
        message: `El código requiere una compra mínima de Q${discount.minPurchase}`
      })
    }

    // Verificar productos aplicables
    if (discount.applicableProducts.length > 0 && productIds.length > 0) {
      const hasApplicableProduct = productIds.some(productId =>
        discount.applicableProducts.includes(productId)
      )
      if (!hasApplicableProduct) {
        return NextResponse.json({
          success: false,
          message: 'El código de descuento no aplica para los productos en tu carrito'
        })
      }
    }

    // Calcular descuento
    const discountAmount = (cartTotal * discount.percentage) / 100

    return NextResponse.json({
      success: true,
      discount: {
        id: discount._id,
        code: discount.code,
        percentage: discount.percentage,
        discountAmount,
        finalAmount: cartTotal - discountAmount,
        description: discount.description,
        maxUses: discount.maxUses,
        usedCount: discount.usedCount
      }
    })

  } catch (error) {
    console.error('Error validating discount:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
