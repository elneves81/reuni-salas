// ==================== NETLIFY FUNCTION: LOGIN COM GOOGLE CLOUD SQL ====================

const { executeQuery } = require('./db-utils');
const bcrypt = require('bcryptjs');

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
        const bodyData = JSON.parse(event.body);
        const { email, password } = bodyData;

        console.log('🔐 Tentativa de login:', { email, passwordLength: password?.length });

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email e senha são obrigatórios' 
                })
            };
        }

        // Buscar usuário no banco Google Cloud SQL
        const users = await executeQuery(`
            SELECT id, name, email, password, role, department, active, last_login
            FROM users 
            WHERE email = ? AND active = TRUE
        `, [email]);

        if (users.length === 0) {
            console.log('❌ Usuário não encontrado:', email);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                })
            };
        }

        const user = users[0];

        // Verificar senha
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log('❌ Senha incorreta para:', email);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                })
            };
        }

        // Atualizar último login
        await executeQuery(`
            UPDATE users SET last_login = NOW() WHERE id = ?
        `, [user.id]);

        console.log('✅ Login bem-sucedido:', email);

        // Gerar token JWT simples (você pode melhorar isso)
        const token = Buffer.from(JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            timestamp: Date.now()
        })).toString('base64');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login realizado com sucesso',
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            })
        };

    } catch (error) {
        console.error('❌ Erro no login:', error);
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
