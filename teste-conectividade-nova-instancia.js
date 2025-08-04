// ==================== TESTE BÁSICO DE CONECTIVIDADE ====================

const mysql = require('mysql2/promise');

async function testarConectividade() {
    console.log('🔌 TESTE DE CONECTIVIDADE - NOVA INSTÂNCIA');
    console.log('=' .repeat(50));
    
    const configs = [
        {
            nome: 'Config 1 - Senha Neves2025@',
            config: {
                host: '35.184.206.243',
                user: 'root',
                password: 'Neves2025@',
                port: 3306,
                ssl: { rejectUnauthorized: false },
                connectTimeout: 10000
            }
        },
        {
            nome: 'Config 2 - Senha Elber@2025',
            config: {
                host: '35.184.206.243',
                user: 'root',
                password: 'Elber@2025',
                port: 3306,
                ssl: { rejectUnauthorized: false },
                connectTimeout: 10000
            }
        }
    ];

    for (const teste of configs) {
        console.log(`\n📋 Testando: ${teste.nome}`);
        console.log(`   Host: ${teste.config.host}`);
        console.log(`   User: ${teste.config.user}`);
        console.log(`   Password: ${teste.config.password}`);
        
        try {
            const connection = await mysql.createConnection(teste.config);
            console.log('✅ CONEXÃO ESTABELECIDA!');
            
            // Testar query simples
            const [rows] = await connection.query('SELECT 1 as test');
            console.log('✅ Query teste executada:', rows[0]);
            
            // Listar bancos
            const [databases] = await connection.query('SHOW DATABASES');
            console.log('📊 Bancos disponíveis:');
            databases.forEach(db => console.log(`   - ${Object.values(db)[0]}`));
            
            await connection.end();
            console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
            return teste.config;
            
        } catch (error) {
            console.log('❌ Falha na conexão:', error.message);
            
            if (error.message.includes('Access denied')) {
                console.log('🔐 Problema: Senha incorreta ou usuário não autorizado');
            } else if (error.message.includes('ECONNREFUSED')) {
                console.log('🌐 Problema: Instância não acessível ou IP não autorizado');
            } else if (error.message.includes('ETIMEDOUT')) {
                console.log('⏰ Problema: Timeout - verificar rede/firewall');
            }
        }
    }
    
    console.log('\n❌ NENHUMA CONFIGURAÇÃO FUNCIONOU');
    console.log('\n🛠️  AÇÕES NECESSÁRIAS:');
    console.log('1. No Google Cloud Console:');
    console.log('   - SQL > Instâncias > Sua Instância');
    console.log('   - Connections > Authorized networks');
    console.log('   - Adicionar IP: 177.87.200.82');
    console.log('   - Adicionar IP: 0.0.0.0/0 (temporário)');
    console.log('2. Verificar se a instância está RODANDO');
    console.log('3. Confirmar a senha do usuário root');
    
    return null;
}

// Executar
testarConectividade().catch(console.error);
