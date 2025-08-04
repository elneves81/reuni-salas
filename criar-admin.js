// ==================== CRIAR USUÁRIO ADMIN ====================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function criarAdmin() {
    let connection;
    
    try {
        // Conectar ao Google Cloud SQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '34.45.56.79',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'app_user',
            password: process.env.DB_PASSWORD || 'Neves@2025',
            database: process.env.DB_NAME || 'sala_livre'
        });

        console.log('✅ Conectado ao Google Cloud SQL');

        // Verificar se admin já existe
        const [existingAdmin] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ?',
            ['admin@salalivre.com']
        );

        if (existingAdmin.length > 0) {
            console.log('✅ Usuário admin já existe:', existingAdmin[0]);
            
            // Atualizar senha para admin123
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@salalivre.com']
            );
            console.log('✅ Senha do admin atualizada para: admin123');
            
        } else {
            // Criar usuário admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const [result] = await connection.execute(`
                INSERT INTO users (name, email, password, role, department, active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                'Administrador do Sistema',
                'admin@salalivre.com', 
                hashedPassword,
                'admin',
                'administração',
                true
            ]);

            console.log('✅ Usuário admin criado com ID:', result.insertId);
        }

        // Listar todos os usuários
        const [users] = await connection.execute('SELECT id, name, email, role, active FROM users');
        console.log('\n📋 Usuários no banco:');
        users.forEach(user => {
            console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.role} - ${user.active ? 'ativo' : 'inativo'}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão fechada');
        }
    }
}

// Carregar .env
try {
    require('dotenv').config();
    console.log('📄 Arquivo .env carregado');
} catch (err) {
    console.log('ℹ️ Arquivo .env não encontrado');
}

criarAdmin();
