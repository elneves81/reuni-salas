// ==================== NETLIFY FUNCTION: LOGIN (SIMPLES) ====================

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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Para teste, aceitar apenas o admin
        if (email === 'admin@salalivre.com' && password === 'admin123') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Login realizado com sucesso',
                    token: 'test-token-123',
                    user: {
                        id: 1,
                        name: 'Administrador',
                        email: 'admin@salalivre.com',
                        role: 'admin'
                    }
                })
            };
        } else {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Credenciais inválidas. Use: admin@salalivre.com / admin123' 
                })
            };
        }

    } catch (error) {
        console.error('Erro no login:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro interno do servidor',
                error: error.message
            })
        };
    }
};
