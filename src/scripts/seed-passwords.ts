/* Script para hashear todas las contraseñas existentes en la BD
 * Ejecutar una sola vez: npx ts-node src/scripts/seed-passwords.ts
 */

import db from '../models';
import bcryptjs from 'bcryptjs';

async function seedPasswords() {
  try {
    console.log('🔐 Iniciando hash de contraseñas...');
    
    // Obtener todos los usuarios
    const users = await db.User.findAll();
    console.log(`📊 Se encontraron ${users.length} usuarios`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      const currentPassword = user.get('password');
      const username = user.get('username');

      // Verificar si ya está hasheada (los hashes bcrypt empiezan con $2a$, $2b$ o $2y$)
      if (currentPassword.startsWith('$2')) {
        console.log(`⏭️  ${username}: ya está hasheada`);
        skipped++;
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = await bcryptjs.hash(currentPassword, 10);
      
      // Actualizar en BD
      await user.update({ password: hashedPassword });
      console.log(`✅ ${username}: contraseña hasheada`);
      updated++;
    }

    console.log('\n📋 Resumen:');
    console.log(`   ✅ Hasheadas: ${updated}`);
    console.log(`   ⏭️  Ya hasheadas: ${skipped}`);
    console.log(`\n🎉 ¡Proceso completado!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedPasswords();