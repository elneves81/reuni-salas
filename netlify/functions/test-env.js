// ==================== TESTE DE VARIÁVEIS DE AMBIENTE NETLIFY ====================

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Verificar variáveis de ambiente
        const envVars = {
            DB_HOST: process.env.DB_HOST || 'NÃO DEFINIDO',
            DB_USER: process.env.DB_USER || 'NÃO DEFINIDO',
            DB_PASSWORD: process.env.DB_PASSWORD || 'NÃO DEFINIDO',
            DB_NAME: process.env.DB_NAME || 'NÃO DEFINIDO',
            DB_PORT: process.env.DB_PORT || 'NÃO DEFINIDO',
            NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO'
        };

        // Configuração atual do banco
        const dbConfig = {
            host: process.env.DB_HOST || '35.184.206.243',
            user: process.env.DB_USER || 'root', 
            password: process.env.DB_PASSWORD || 'Neves2025@',
            database: process.env.DB_NAME || 'reuni-dep',
            port: process.env.DB_PORT || 3306
        };

        console.log('🔍 Variáveis de ambiente verificadas:', envVars);
        console.log('⚙️ Configuração do banco:', {
            ...dbConfig,
            password: dbConfig.password ? '***DEFINIDA***' : 'NÃO DEFINIDA'
        });

        // Tentar conexão de teste
        const mysql = require('mysql2/promise');
        let connectionTest = 'FALHOU';
        
        try {
            const connection = await mysql.createConnection({
                ...dbConfig,
                ssl: { rejectUnauthorized: false },
                connectTimeout: 10000
            });
            
            await connection.query('SELECT 1 as test');
            await connection.end();
            connectionTest = 'SUCESSO';
        } catch (dbError) {
            connectionTest = `ERRO: ${dbError.message}`;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                variaveisAmbiente: envVars,
                configuracaoBanco: {
                    ...dbConfig,
                    password: dbConfig.password ? '***DEFINIDA***' : 'NÃO DEFINIDA'
                },
                testeConexao: connectionTest,
                status: 'Teste de ambiente concluído'
            }, null, 2)
        };

    } catch (error) {
        console.error('❌ Erro no teste de ambiente:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erro no teste de ambiente',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
