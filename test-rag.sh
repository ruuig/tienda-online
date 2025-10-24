#!/bin/bash
# Script para verificar que el sistema RAG esté funcionando correctamente

echo "🔍 Verificando configuración del sistema RAG..."

# Verificar variables de entorno
echo "📋 Verificando variables de entorno..."
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY configurada"
else
    echo "❌ OPENAI_API_KEY no configurada"
fi

if [ -n "$MONGODB_URI" ]; then
    echo "✅ MONGODB_URI configurada"
else
    echo "❌ MONGODB_URI no configurada"
fi

echo ""
echo "🚀 Probando APIs de RAG..."
echo "=========================="

BASE_URL="http://localhost:3001"

echo ""
echo "📊 1. Health Check del sistema RAG:"
echo "curl -s $BASE_URL/api/rag/health | jq ."
curl -s "$BASE_URL/api/rag/health" | jq .status

echo ""
echo "📈 2. Status simple del sistema RAG:"
echo "curl -s $BASE_URL/api/rag/status | jq ."
curl -s "$BASE_URL/api/rag/status" | jq .status

echo ""
echo "🧪 3. Test completo del sistema RAG:"
echo "curl -s $BASE_URL/api/rag/test | jq ."
curl -s "$BASE_URL/api/rag/test" | jq .tests

echo ""
echo "📄 3. Listado de documentos:"
echo "curl -s $BASE_URL/api/rag/documents | jq ."
curl -s "$BASE_URL/api/rag/documents" | jq '.documents | length'

echo ""
echo "🌐 Navegador - Pruebas manuales:"
echo "1. Ve a: http://localhost:3001/seller/documents"
echo "2. Inicia sesión con Clerk si es necesario"
echo "3. Sube un archivo PDF o TXT"
echo "4. Haz clic en '🚀 Procesar con RAG (Real)'"
echo "5. Verifica que el documento se procese correctamente"
echo ""
echo "🔧 Comandos adicionales:"
echo "- Health: curl $BASE_URL/api/rag/health"
echo "- Test: curl $BASE_URL/api/rag/test"
echo "- Chat: curl -X POST $BASE_URL/api/chat/stream -H 'Content-Type: application/json' -d '{\"message\": \"Hola\"}'"
