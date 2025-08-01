// ==================== NETLIFY FUNCTION: LOGIN ====================

exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
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
        // Importar dependências dentro da function
        const mysql = require('mysql2/promise');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');

        const { email, password } = JSON.parse(event.body);

        console.log('Login attempt for:', email);

        // Conectar ao banco Google Cloud SQL
        const connection = await mysql.createConnection({
            host: '34.45.56.79',
            user: 'app_user',
            password: 'Neves@2025',
            database: 'sala_livre',
            port: 3306,
            connectTimeout: 10000
        });

        console.log('Database connected');

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
        console.log('User found:', user.name);

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

        console.log('Login successful for:', user.email);

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
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro interno: ' + error.message
            })
        };
    }
};
