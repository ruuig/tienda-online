'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RAGDemoRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to seller documents panel
    router.replace('/seller/documents');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al panel de documentos RAG...</p>
                    disabled={isStreaming || !currentMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStreaming ? '⏳' : '📤'}
                  </button>
                </div>

                {/* Quick Questions */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Preguntas rápidas para probar:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '¿Qué productos tienen?',
                      '¿Tienen iPhone?',
                      '¿Cuál es la política de devoluciones?',
                      '¿Hacen envíos?',
                      '¿Cómo funciona la garantía?'
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        disabled={isStreaming}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-200 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-50 p-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">🔍 Búsqueda Inteligente</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Búsqueda en productos primero</li>
                  <li>• Fallback a documentos RAG</li>
                  <li>• Respuesta general si no hay contexto</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">⚡ Performance</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• GPT-3.5-turbo para velocidad</li>
                  <li>• Embeddings optimizados</li>
                  <li>• Cache de 5 minutos</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">📊 Métricas</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Tiempo de respuesta en ms</li>
                  <li>• Indicadores de contexto usado</li>
                  <li>• Estado de streaming en tiempo real</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
