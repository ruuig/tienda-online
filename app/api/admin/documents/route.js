// API para gestión de documentos RAG del administrador
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const type = formData.get('type');
    const category = formData.get('category');
    const description = formData.get('description');

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Validar campos requeridos
    if (!file || !title || !type || !category) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo PDFs)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Solo se permiten archivos PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'El archivo no puede ser mayor a 10MB' },
        { status: 400 }
      );
    }

    // Crear directorio de documentos si no existe
    const documentsDir = join(process.cwd(), 'documents');
    if (!existsSync(documentsDir)) {
      await mkdir(documentsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(documentsDir, fileName);

    // Convertir el archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Crear registro del documento
    const documentRecord = {
      id: `doc_${timestamp}`,
      title,
      type,
      category,
      description,
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      isActive: true,
      createdAt: new Date().toISOString(),
      uploadedBy: 'seller@tienda.com'
    };

    // Guardar registro en JSON (en producción usar base de datos)
    const documentsIndexPath = join(documentsDir, 'index.json');
    let documentsIndex = [];

    if (existsSync(documentsIndexPath)) {
      const indexData = await import('fs').then(fs => fs.readFileSync(documentsIndexPath, 'utf8'));
      documentsIndex = JSON.parse(indexData);
    }

    documentsIndex.push(documentRecord);

    await import('fs').then(fs => fs.writeFileSync(
      documentsIndexPath,
      JSON.stringify(documentsIndex, null, 2)
    ));

    console.log('✅ Documento PDF subido por seller:', {
      id: documentRecord.id,
      title,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      document: documentRecord
    });

  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const documentsDir = join(process.cwd(), 'documents');
    const documentsIndexPath = join(documentsDir, 'index.json');

    if (!existsSync(documentsIndexPath)) {
      return NextResponse.json({
        success: true,
        documents: [],
        stats: { totalDocuments: 0, totalSize: 0 }
      });
    }

    const indexData = await import('fs').then(fs => fs.readFileSync(documentsIndexPath, 'utf8'));
    const documents = JSON.parse(indexData);

    // Calcular estadísticas
    const stats = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
      activeDocuments: documents.filter(doc => doc.isActive).length
    };

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    const fs = await import('fs');
    const path = await import('path');

    const documentsDir = join(process.cwd(), 'documents');
    const documentsIndexPath = join(documentsDir, 'index.json');

    if (!existsSync(documentsIndexPath)) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron documentos' },
        { status: 404 }
      );
    }

    const indexData = fs.readFileSync(documentsIndexPath, 'utf8');
    let documents = JSON.parse(indexData);

    // Buscar el documento
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const document = documents[documentIndex];

    // Eliminar archivo físico
    const filePath = join(documentsDir, document.fileName);
    if (existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar del índice
    documents.splice(documentIndex, 1);
    fs.writeFileSync(documentsIndexPath, JSON.stringify(documents, null, 2));

    console.log('✅ Documento eliminado por seller:', {
      id: documentId,
      title: document.title,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, isActive, title, description, type, category } = body;

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    const fs = await import('fs');
    const path = await import('path');

    const documentsDir = join(process.cwd(), 'documents');
    const documentsIndexPath = join(documentsDir, 'index.json');

    if (!existsSync(documentsIndexPath)) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron documentos' },
        { status: 404 }
      );
    }

    const indexData = fs.readFileSync(documentsIndexPath, 'utf8');
    let documents = JSON.parse(indexData);

    // Buscar y actualizar el documento
    const documentIndex = documents.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar campos
    if (isActive !== undefined) documents[documentIndex].isActive = isActive;
    if (title) documents[documentIndex].title = title;
    if (description !== undefined) documents[documentIndex].description = description;
    if (type) documents[documentIndex].type = type;
    if (category) documents[documentIndex].category = category;

    documents[documentIndex].updatedAt = new Date().toISOString();
    documents[documentIndex].updatedBy = 'seller@tienda.com';

    // Guardar cambios
    fs.writeFileSync(documentsIndexPath, JSON.stringify(documents, null, 2));

    console.log('✅ Documento actualizado por seller:', {
      id,
      changes: { isActive, title, description, type, category },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      document: documents[documentIndex]
    });

  } catch (error) {
    console.error('❌ Error actualizando documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
