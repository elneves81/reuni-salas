// ==================== NETLIFY FUNCTION: HEALTH CHECK ====================

const { testConnection } = require('./db-utils');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Responder a OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('🔍 Executando health check...');

        // Testar conexão com banco
        const dbStatus = await testConnection();

        const health = {
            status: dbStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'salalivre-api',
            version: '1.0.0',
            database: {
                status: dbStatus ? 'connected' : 'disconnected',
                type: 'Google Cloud SQL',
                host: process.env.DB_HOST || '34.45.56.79'
            },
            environment: {
                node_version: process.version,
                platform: process.platform
            }
        };

        const statusCode = dbStatus ? 200 : 503;

        console.log(`✅ Health check completado - Status: ${health.status}`);

        return {
            statusCode,
            headers,
            body: JSON.stringify(health)
        };

    } catch (error) {
        console.error('❌ Erro no health check:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message,
                service: 'salalivre-api'
            })
        };
    }
};
