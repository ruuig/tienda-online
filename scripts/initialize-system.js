#!/usr/bin/env node

// Script de inicialización del sistema de chat avanzado
import { initializeChatSystem } from '../src/infrastructure/system/chatSystemManager.js';

async function main() {
  try {
    console.log('🚀 Iniciando sistema de chat avanzado...\n');

    const systemManager = await initializeChatSystem();

    console.log('\n✅ Sistema inicializado exitosamente!');
    console.log('📊 Estado del sistema:', systemManager.getSystemStats());

    // Mantener el proceso activo
    process.stdin.resume();

    console.log('\n🔄 Sistema corriendo... Presiona Ctrl+C para detener');

  } catch (error) {
    console.error('\n❌ Error inicializando sistema:', error);
    process.exit(1);
  }
}

// Manejo de señales
process.on('SIGINT', () => {
  console.log('\n📴 Deteniendo sistema...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📴 Señal de terminación recibida...');
  process.exit(0);
});

// Ejecutar inicialización
main();
