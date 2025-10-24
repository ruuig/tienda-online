#!/usr/bin/env node

// Script para remover todas las verificaciones de autorización
// Ejecutar: node scripts/removeAuthChecks.js

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../app/api');

function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else if (item === 'route.js') {
      files.push(fullPath);
    }
  }

  return files;
}

function removeAuthChecks(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remover verificaciones de authSeller
    if (content.includes('authSeller')) {
      // Remover import de authSeller
      content = content.replace(/import authSeller from ['"]@\/lib\/authSeller['"];?\n/g, '');
      content = content.replace(/import authSeller from ['"]..\/..\/lib\/authSeller['"];?\n/g, '');

      // Remover verificaciones if (!isSeller)
      content = content.replace(
        /const isSeller = await authSeller\(userId\)\s*if \(!isSeller\) \{\s*return NextResponse\.json\(\{ success: false, message: ['"]not authorized['"] \}\);\s*\}/g,
        ''
      );

      // Remover verificaciones más simples
      content = content.replace(
        /if \(!isSeller\) \{\s*return NextResponse\.json\(\{ success: false, message: ['"]not authorized['"] \}\);\s*\}/g,
        ''
      );

      // Remover variables isSeller no utilizadas
      content = content.replace(/const isSeller = await authSeller\(userId\)\n/g, '');

      // Remover logs relacionados con isSeller
      content = content.replace(/console\.log\(['"]🔍[^'"]*isSeller['"][^)]*\)\n/g, '');

      modified = true;
    }

    // Remover imports de getAuth no utilizados
    const lines = content.split('\n');
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Si es import de getAuth y no se usa userId después
      if (line.includes("import { getAuth } from '@clerk/nextjs/server'")) {
        // Verificar si userId se usa más adelante
        const remainingContent = lines.slice(i + 1).join('\n');
        if (!remainingContent.includes('getAuth') && !remainingContent.includes('userId')) {
          continue; // Saltar esta línea
        }
      }

      // Si es const { userId } = getAuth(request) y userId no se usa
      if (line.includes('const { userId } = getAuth(request)')) {
        const remainingContent = lines.slice(i + 1).join('\n');
        if (!remainingContent.includes('userId')) {
          continue; // Saltar esta línea
        }
      }

      newLines.push(line);
    }

    content = newLines.join('\n');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔍 Buscando archivos de API...');
const files = findFiles(API_DIR);

console.log(`📁 Encontrados ${files.length} archivos route.js`);

files.forEach(removeAuthChecks);

console.log('✅ ¡Completado! Todas las verificaciones de autorización han sido removidas.');
