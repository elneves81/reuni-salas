// ==================== VERIFICAR ESTRUTURA TABELA USERS ====================

const mysql = require('mysql2/promise');

const dbConfig = {
    host: '35.184.206.243',
    user: 'root',
    password: 'Neves2025@',
    database: 'reuni-dep',
    port: 3306,
    ssl: false
};

async function verificarEstrutura() {
    let connection = null;
    
    try {
        console.log('🔌 CONECTANDO NO BANCO...');
        connection = await mysql.createConnection(dbConfig);
        
        console.log('📋 VERIFICANDO ESTRUTURA DA TABELA USERS...');
        const [columns] = await connection.execute('DESCRIBE users');
        
        console.log('📊 COLUNAS DA TABELA USERS:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
        });
        
        console.log('\n👥 DADOS DOS USUÁRIOS:');
        const [users] = await connection.execute('SELECT * FROM users LIMIT 3');
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
        
    } catch (error) {
        console.error('❌ ERRO:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verificarEstrutura();
