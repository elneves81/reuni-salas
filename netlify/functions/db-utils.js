// ==================== CONEXÃO GOOGLE CLOUD SQL PARA NETLIFY ====================

const mysql = require('mysql2/promise');

// Configuração do banco (usando variáveis de ambiente do Netlify)
const dbConfig = {
    host: process.env.DB_HOST || '35.184.206.243',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASS || process.env.DB_PASSWORD || 'Neves2025@',
    database: process.env.DB_NAME || 'reuni-dep',
    port: process.env.DB_PORT || 3306,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    ssl: {
        rejectUnauthorized: false
    }
};

// Pool de conexões
let pool = null;

function createPool() {
    if (!pool) {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('✅ Pool MySQL criado para Google Cloud SQL');
    }
    return pool;
}

// Função para executar queries
async function executeQuery(query, params = []) {
    try {
        const connection = createPool();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw new Error(`Erro no banco: ${error.message}`);
    }
}

// Função para testar conexão
async function testConnection() {
    try {
        const result = await executeQuery('SELECT 1 as test');
        console.log('✅ Conexão com Google Cloud SQL OK');
        return true;
    } catch (error) {
        console.error('❌ Falha na conexão:', error);
        return false;
    }
}

// Headers CORS padrão
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

// Função para responder CORS
function handleCORS(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    return null;
}

// Função para resposta de sucesso
function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(data)
    };
}

// Função para resposta de erro
function errorResponse(message, statusCode = 400) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ 
            error: message,
            timestamp: new Date().toISOString()
        })
    };
}

module.exports = {
    executeQuery,
    testConnection,
    corsHeaders,
    handleCORS,
    successResponse,
    errorResponse,
    dbConfig
};
