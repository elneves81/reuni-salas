// ==================== NETLIFY FUNCTION: LOGIN DEBUG ====================

exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    try {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                debug: true,
                method: event.httpMethod,
                body: event.body,
                headers: event.headers,
                query: event.queryStringParameters,
                path: event.path
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message
            })
        };
    }
};
