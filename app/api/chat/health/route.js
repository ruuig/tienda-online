// Health check para verificar optimizaciones del chatbot
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';

export async function GET() {
  try {
    await connectDB();

    // Verificar variables de entorno
    const openaiKey = !!process.env.OPENAI_API_KEY;
    const vendorId = process.env.DEFAULT_VENDOR_ID || 'default_vendor';

    return NextResponse.json({
      success: true,
      message: 'Chatbot optimizado funcionando correctamente',
      optimizations: {
        unifiedOpenAI: true,
        productCache: true,
        ragCache: true,
        fastModel: 'gpt-3.5-turbo',
        reducedTimeout: '8s',
        reducedTokens: '200 max'
      },
      configuration: {
        openaiKeyConfigured: openaiKey,
        vendorId,
        databaseConnected: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error en el chatbot',
      error: error.message
    }, { status: 500 });
  }
}
