// ==================== TESTE DIRETO DE CONEXÃO ====================

const mysql = require('mysql2/promise');

// Configuração direta com credenciais do projeto
const dbConfig = {
    host: '35.184.206.243',
    user: 'app_user', 
    password: 'SalaLivre2024!',  // Senha do setup
    database: 'reuni-dep',
    port: 3306,
    connectTimeout: 60000
};

async function testarConexaoDireta() {
    console.log('🔗 === TESTE DIRETO DE CONEXÃO ===\n');
    
    try {
        console.log('📡 Conectando ao banco...');
        const connection = await mysql.createConnection(dbConfig);
        
        console.log('✅ Conexão estabelecida!');
        
        // 1. Testar consulta básica
        console.log('\n1. 🧪 Testando consulta básica...');
        const [testResult] = await connection.execute('SELECT 1 as test, NOW() as now');
        console.log('✅ Consulta básica OK:', testResult[0]);
        
        // 2. Verificar tabelas
        console.log('\n2. 📋 Verificando tabelas...');
        const [tables] = await connection.execute("SHOW TABLES");
        console.log('📊 Tabelas encontradas:', tables.map(t => Object.values(t)[0]));
        
        // 3. Verificar estrutura da tabela bookings
        if (tables.find(t => Object.values(t)[0] === 'bookings')) {
            console.log('\n3. 🏗️ Estrutura da tabela bookings:');
            const [structure] = await connection.execute("DESCRIBE bookings");
            
            structure.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
            });
            
            // 4. Verificar dados
            console.log('\n4. 📊 Dados na tabela bookings:');
            const [count] = await connection.execute("SELECT COUNT(*) as total FROM bookings");
            console.log(`Total de registros: ${count[0].total}`);
            
            if (count[0].total > 0) {
                const [sample] = await connection.execute("SELECT * FROM bookings LIMIT 3");
                console.log('📝 Amostra de dados:', sample);
            }
        } else {
            console.log('❌ Tabela bookings não encontrada!');
            
            // Listar todas as tabelas disponíveis
            console.log('\n📋 Tabelas disponíveis:');
            tables.forEach(table => {
                console.log(`- ${Object.values(table)[0]}`);
            });
        }
        
        await connection.end();
        console.log('\n🎉 Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔑 Problema de autenticação:');
            console.log('- Verificar usuário e senha');
            console.log('- Verificar se o IP está liberado');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🌐 Problema de conectividade:');
            console.log('- Verificar se o servidor está online');
            console.log('- Verificar firewall/rede');
        }
    }
}

// Executar teste
testarConexaoDireta();
