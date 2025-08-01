// ==================== NETLIFY FUNCTION: LOGIN ====================
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': 'https://salalivre.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
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

        // Conectar ao banco Google Cloud SQL
        const connection = await mysql.createConnection({
            host: '34.45.56.79',
            user: 'app_user',
            password: 'Neves@2025',
            database: 'sala_livre',
            port: 3306
        });

        // Buscar usuário
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ? AND active = true',
            [email]
        );

        if (users.length === 0) {
            await connection.end();
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'E-mail não encontrado' 
                })
            };
        }

        const user = users[0];

        // Verificar senha
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            await connection.end();
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Senha incorreta' 
                })
            };
        }

        // Atualizar último login
        await connection.execute(
            'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
            [user.id]
        );

        await connection.end();

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            'sala_livre_jwt_secret_production_2025',
            { expiresIn: '7d' }
        );

        // Remover senha do retorno
        delete user.password;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login realizado com sucesso',
                token,
                user
            })
        };

    } catch (error) {
        console.error('Erro no login:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro interno do servidor' 
            })
        };
    }
};
