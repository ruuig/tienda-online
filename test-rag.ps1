# Script para verificar que el sistema RAG esté funcionando correctamente (Windows)
# Ejecutar: powershell -ExecutionPolicy Bypass -File test-rag.ps1

Write-Host "🔍 Verificando configuración del sistema RAG..." -ForegroundColor Cyan

# Verificar variables de entorno
Write-Host "📋 Verificando variables de entorno..." -ForegroundColor Yellow

if (Test-Path env:OPENAI_API_KEY) {
    Write-Host "✅ OPENAI_API_KEY configurada" -ForegroundColor Green
} else {
    Write-Host "❌ OPENAI_API_KEY no configurada" -ForegroundColor Red
}

if (Test-Path env:MONGODB_URI) {
    Write-Host "✅ MONGODB_URI configurada" -ForegroundColor Green
} else {
    Write-Host "❌ MONGODB_URI no configurada" -ForegroundColor Red
}

$BASE_URL = "http://localhost:3001"

Write-Host ""
Write-Host "🚀 Probando APIs de RAG..." -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📊 1. Health Check del sistema RAG:" -ForegroundColor Yellow
Write-Host "Comando: curl -s $BASE_URL/api/rag/health" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/rag/health" -Method Get
    $response.status | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en health check: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📈 2. Status simple del sistema RAG:" -ForegroundColor Yellow
Write-Host "Comando: curl -s $BASE_URL/api/rag/status" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/rag/status" -Method Get
    $response.status | ConvertTo-Json -Depth 3

    if ($response.isWorking -eq $true) {
        Write-Host "🚀 Sistema RAG: OPERATIVO" -ForegroundColor Green
    } else {
        Write-Host "🚀 Sistema RAG: REQUIERE ATENCION" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error en status check: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🧪 3. Test completo del sistema RAG:" -ForegroundColor Yellow
Write-Host "Comando: curl -s $BASE_URL/api/rag/test" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/rag/test" -Method Get
    $response.tests | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📄 3. Listado de documentos:" -ForegroundColor Yellow
Write-Host "Comando: curl -s $BASE_URL/api/rag/documents" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/rag/documents" -Method Get
    $documentsCount = $response.documents.Length
    Write-Host "📄 Documentos encontrados: $documentsCount" -ForegroundColor Green
} catch {
    Write-Host "❌ Error listando documentos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💬 4. Probando chat con RAG:" -ForegroundColor Yellow
Write-Host "Comando: curl -X POST -H 'Content-Type: application/json' -d '{\"message\": \"Hola, ¿qué información tienes?\"}' $BASE_URL/api/chat/stream" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/chat/stream" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"message": "Hola, ¿qué información tienes disponible?"}'
    Write-Host "💬 Respuesta del chat recibida" -ForegroundColor Green
    Write-Host "Respuesta: $($response | Select-Object -First 200)..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Error en chat: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Navegador - Pruebas manuales:" -ForegroundColor Cyan
Write-Host "1. Ve a: http://localhost:3001/seller/documents" -ForegroundColor White
Write-Host "2. Inicia sesión con Clerk si es necesario" -ForegroundColor White
Write-Host "3. Sube un archivo PDF o TXT" -ForegroundColor White
Write-Host "4. Haz clic en '🚀 Procesar con RAG (Real)'" -ForegroundColor White
Write-Host "5. Verifica que el documento se procese correctamente" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Comandos adicionales para PowerShell:" -ForegroundColor Cyan
Write-Host "- Health: Invoke-RestMethod -Uri '$BASE_URL/api/rag/health' -Method Get | Select-Object status" -ForegroundColor Gray
Write-Host "- Test: Invoke-RestMethod -Uri '$BASE_URL/api/rag/test' -Method Get | Select-Object tests" -ForegroundColor Gray
Write-Host "- Documents: Invoke-RestMethod -Uri '$BASE_URL/api/rag/documents' -Method Get | Select-Object documents" -ForegroundColor Gray
Write-Host "- Chat: Invoke-RestMethod -Uri '$BASE_URL/api/chat/stream' -Method Post -Headers @{'Content-Type'='application/json'} -Body '{\"message\": \"Hola\"}'" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Pruebas completadas!" -ForegroundColor Green
