import { NextResponse } from 'next/server';

// GET /api/chat/product-context - Obtener contexto de productos para el chat
export async function GET(request) {
  console.log('🔍 API Product Context - Simple test version');

  try {
    return NextResponse.json({
      success: true,
      message: 'API endpoint is working',
      context: 'Este es un endpoint de prueba. La funcionalidad completa se implementará próximamente.',
      products: [],
      summary: {
        totalProducts: 0,
        categories: [],
        priceRange: { min: 0, max: 0 }
      }
    });

  } catch (error) {
    console.error('❌ Error in simple API:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}
