// Script para probar que la extracción de PDF funciona correctamente
// Ejecutar: node scripts/testPDFExtraction.js

const fs = require('fs');
const path = require('path');

async function testPDFExtraction() {
  console.log('🧪 Probando extracción de PDF...');
  console.log('=================================');

  try {
    // Crear un PDF de prueba con texto legible
    const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 85
>>
stream
BT
/F1 12 Tf
50 700 Td
(Información de RJG Tech Shop) Tj
0 -20 Td
(Fundada en 2024) Tj
0 -20 Td
(Horario: Lunes a Viernes 8AM-6PM) Tj
0 -20 Td
(Teléfonos: +502 5712-0482) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000411 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
468
%%EOF`;

    // Crear archivo PDF temporal
    const tempPDFPath = path.join(__dirname, '../documents/test-rjg-shop.pdf');
    fs.writeFileSync(tempPDFPath, testPDFContent, 'binary');
    console.log(`✅ PDF de prueba creado: ${tempPDFPath}`);

    // Probar extracción con pdf-parse
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(tempPDFPath);
    const pdfData = await pdfParse(buffer);

    console.log(`📄 Texto extraído: ${pdfData.text.length} caracteres`);
    console.log(`📋 Contenido extraído:`);
    console.log('---');
    console.log(pdfData.text);
    console.log('---');

    if (pdfData.text.includes('RJG Tech Shop')) {
      console.log('✅ ¡Extracción de PDF funcionando correctamente!');
    } else {
      console.log('❌ Extracción de PDF falló');
    }

    // Limpiar archivo temporal
    fs.unlinkSync(tempPDFPath);
    console.log('🗑️ Archivo temporal eliminado');

  } catch (error) {
    console.error('❌ Error durante la prueba de PDF:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPDFExtraction();
}

module.exports = { testPDFExtraction };
