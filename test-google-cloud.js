// ==================== TESTE DE CONEXÃO GOOGLE CLOUD SQL ====================

const mysql = require('mysql2/promise');

async function testGoogleCloudConnection() {
    console.log('🔍 Testando conexão com Google Cloud SQL...\n');

    // Configurações de conexão (você precisa preencher com seus dados)
    const connectionConfig = {
        host: process.env.DB_HOST || 'SEU_IP_CLOUD_SQL_AQUI',
        user: process.env.DB_USER || 'app_user',
        password: process.env.DB_PASSWORD || 'SUA_SENHA_AQUI',
        database: process.env.DB_NAME || 'sala_livre',
        port: process.env.DB_PORT || 3306,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
    };

    console.log('📋 Configurações de conexão:');
    console.log(`   Host: ${connectionConfig.host}`);
    console.log(`   User: ${connectionConfig.user}`);
    console.log(`   Database: ${connectionConfig.database}`);
    console.log(`   Port: ${connectionConfig.port}\n`);

    try {
        console.log('🔄 Tentando conectar...');
        
        // Criar conexão
        const connection = await mysql.createConnection(connectionConfig);
        
        console.log('✅ Conexão estabelecida com sucesso!\n');
        
        // Teste básico
        console.log('🧪 Executando teste básico...');
        const [basicTest] = await connection.execute('SELECT 1 as test, NOW() as current_datetime');
        console.log('✅ Teste básico passou:', basicTest[0]);
        
        // Verificar se o banco existe
        console.log('\n🗄️ Verificando banco de dados...');
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === connectionConfig.database);
        
        if (dbExists) {
            console.log(`✅ Banco '${connectionConfig.database}' encontrado!`);
        } else {
            console.log(`❌ Banco '${connectionConfig.database}' não encontrado!`);
            console.log('📋 Bancos disponíveis:');
            databases.forEach(db => console.log(`   - ${db.Database}`));
        }
        
        // Verificar tabelas (se o banco existir)
        if (dbExists) {
            console.log('\n📊 Verificando tabelas...');
            const [tables] = await connection.execute('SHOW TABLES');
            
            if (tables.length > 0) {
                console.log('✅ Tabelas encontradas:');
                tables.forEach(table => {
                    const tableName = Object.values(table)[0];
                    console.log(`   - ${tableName}`);
                });
            } else {
                console.log('⚠️ Nenhuma tabela encontrada. Execute "npm run setup-db" para criar as tabelas.');
            }
        }
        
        // Fechar conexão
        await connection.end();
        console.log('\n✅ Teste concluído com sucesso!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na conexão com Google Cloud SQL:', error.message);
        console.error('\n🔧 Possíveis soluções:');
        console.error('   1. Verifique se o IP está correto');
        console.error('   2. Confirme usuário e senha');
        console.error('   3. Verifique se a instância está ativa');
        console.error('   4. Confirme as redes autorizadas (0.0.0.0/0 para teste)');
        console.error('   5. Verifique se as APIs do Cloud SQL estão habilitadas');
        
        return false;
    }
}

// ==================== EXECUTAR TESTE ====================

if (require.main === module) {
    // Carregar variáveis de ambiente se existir .env
    try {
        require('dotenv').config();
    } catch (err) {
        console.log('ℹ️ Arquivo .env não encontrado, usando valores padrão');
    }
    
    testGoogleCloudConnection()
        .then(success => {
            if (success) {
                console.log('\n🎉 Conexão com Google Cloud SQL funcionando!');
                process.exit(0);
            } else {
                console.log('\n💥 Falha na conexão. Verifique as configurações.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Erro inesperado:', error);
            process.exit(1);
        });
}

module.exports = testGoogleCloudConnection;
