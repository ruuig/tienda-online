import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/document - Obtener documentos disponibles
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden ver documentos
    if (!user.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para ver documentos'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (isActive !== null) filters.isActive = isActive === 'true';

    const documentRepository = new DocumentRepositoryImpl();
    const documents = await documentRepository.findAll(filters);

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chat/document - Crear nuevo documento
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden crear documentos
    if (!user.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para crear documentos'
      }, { status: 403 });
    }

    const { title, content, type, category, tags } = await request.json();

    if (!title || !content || !type || !category) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    const documentRepository = new DocumentRepositoryImpl();

    const documentData = {
      title,
      content,
      type,
      category,
      tags: tags || [],
      metadata: {
        uploadedBy: user.id
      },
      createdAt: new Date()
    };

    const document = await documentRepository.create(documentData);

    return NextResponse.json({
      success: true,
      document
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear documento:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
