// ==================== VERIFICAR HASH DA SENHA ADMIN ====================

const bcrypt = require('bcryptjs');

async function verificarSenhas() {
    console.log('🔍 TESTANDO SENHAS COMUNS PARA ADMIN...');
    
    const senhasParaTestar = [
        '123456',
        'admin123',
        'admin',
        'password',
        'senha123',
        'reunipro123'
    ];
    
    // Hash do banco: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
    const hashNoBanco = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    for (const senha of senhasParaTestar) {
        const resultado = await bcrypt.compare(senha, hashNoBanco);
        console.log(`Senha "${senha}": ${resultado ? '✅ CORRETA' : '❌ Incorreta'}`);
    }
    
    // Verificar se o hash é do "password"
    const hashPassword = await bcrypt.hash('password', 10);
    console.log('\n📝 Hash gerado para "password":', hashPassword);
    
    // O hash no banco parece ser de "password" (Laravel default)
    const isPassword = await bcrypt.compare('password', hashNoBanco);
    console.log('\n🎯 SENHA CORRETA:', isPassword ? 'password' : 'outra');
}

verificarSenhas().catch(console.error);
