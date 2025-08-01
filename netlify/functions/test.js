// ==================== TESTE SIMPLES NETLIFY FUNCTION ====================
exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Responder a OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Responder a qualquer método
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'API funcionando!',
            timestamp: new Date().toISOString(),
            method: event.httpMethod,
            path: event.path
        })
    };
};
