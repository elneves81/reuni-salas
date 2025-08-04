// ==================== DEBUG SIMPLES NETLIFY ====================

exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            timestamp: new Date().toISOString(),
            message: 'Debug endpoint funcionando!',
            environment: {
                DB_HOST: process.env.DB_HOST || 'NAO_DEFINIDO',
                DB_USER: process.env.DB_USER || 'NAO_DEFINIDO',
                DB_NAME: process.env.DB_NAME || 'NAO_DEFINIDO',
                NODE_ENV: process.env.NODE_ENV || 'NAO_DEFINIDO'
            }
        })
    };
};
