#!/bin/bash
# Script completo de pruebas del sistema RAG
# Ejecutar: ./test-rag-complete.sh

echo "🧪 PRUEBA COMPLETA DEL SISTEMA RAG"
echo "==================================="
echo ""

BASE_URL="http://localhost:3001"

echo "📋 1. Verificando estado del sistema RAG..."
echo "Comando: curl -s $BASE_URL/api/rag/health | jq ."
echo ""

curl -s "$BASE_URL/api/rag/health" | jq .status

echo ""
echo "📈 2. Status simple del sistema RAG..."
echo "Comando: curl -s $BASE_URL/api/rag/status | jq ."
echo ""

curl -s "$BASE_URL/api/rag/status" | jq .status

echo ""
echo "🧪 3. Probando endpoint de test RAG..."
echo "Comando: curl -s $BASE_URL/api/rag/test | jq ."
echo ""

curl -s "$BASE_URL/api/rag/test" | jq .tests

echo ""
echo "📊 4. Verificando documentos disponibles..."
echo "Comando: curl -s $BASE_URL/api/rag/documents | jq ."
echo ""

curl -s "$BASE_URL/api/rag/documents" | jq '.documents | length'

echo ""
echo "💬 5. Probando chat con preguntas específicas..."

test_questions=(
  "¿Cuál es el horario de atención?"
  "¿Cómo hago un pedido?"
  "¿Qué métodos de pago aceptan?"
  "¿Dónde está ubicada la tienda?"
  "¿Los productos tienen garantía?"
)

for question in "${test_questions[@]}"; do
  echo ""
  echo "❓ Pregunta: $question"
  echo "💬 Respuesta:"

  response=$(curl -s -X POST "$BASE_URL/api/chat/stream" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$question\"}" 2>/dev/null | head -5)

  echo "$response"
  echo "----------------------------------------"
done

echo ""
echo "✅ ¡Pruebas completadas!"
echo ""
echo "📋 Resumen de comandos disponibles:"
echo "- npm run rag:health    (verificar estado del sistema)"
echo "- npm run rag:status    (status simple)"
echo "- npm run rag:clean     (limpiar documentos corruptos)"
echo "- npm run rag:test-pdf  (probar extracción de PDF)"
echo "- npm run rag:test      (pruebas completas)"
echo ""
echo "🌐 Para probar manualmente:"
echo "1. Ve a: $BASE_URL/seller/documents"
echo "2. Sube un PDF con información de tu tienda"
echo "3. Ve a: $BASE_URL/chat"
echo "4. Haz preguntas sobre la información del PDF"
echo ""
echo "🔍 Si tienes problemas:"
echo "- Verifica que el PDF contenga texto legible"
echo "- Usa 'Procesar' en documentos para recrear embeddings"
echo "- Revisa logs del servidor para ver mensajes de debug"
