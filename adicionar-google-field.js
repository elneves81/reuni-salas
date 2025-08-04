// ==================== ADICIONAR CAMPO GOOGLE_ID ====================

const mysql = require('mysql2/promise');

async function adicionarCampoGoogle() {
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

        // Verificar estrutura atual da tabela
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM users LIKE 'google_id'
        `);

        if (columns.length === 0) {
            console.log('➕ Adicionando campo google_id...');
            
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN google_id VARCHAR(255) NULL,
                ADD INDEX idx_google_id (google_id)
            `);
            
            console.log('✅ Campo google_id adicionado com sucesso!');
        } else {
            console.log('✅ Campo google_id já existe');
        }

        // Mostrar estrutura atualizada
        const [structure] = await connection.execute('DESCRIBE users');
        console.log('\n📋 Estrutura da tabela users:');
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''}`);
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

adicionarCampoGoogle();
