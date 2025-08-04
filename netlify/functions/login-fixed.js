// ==================== LOGIN FUNCTION - NETLIFY ====================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    let connection = null;
    
    try {
        // Parse do body
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email e senha são obrigatórios' })
            };
        }

        // Configuração do banco com valores padrão
        const dbConfig = {
            host: process.env.DB_HOST || '35.184.206.243',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Neves2025@',
            database: process.env.DB_NAME || 'reuni-dep',
            port: parseInt(process.env.DB_PORT || '3306'),
            ssl: false,
            connectTimeout: 10000,
            acquireTimeout: 10000
        };

        // Criar conexão
        connection = await mysql.createConnection(dbConfig);
        
        // Buscar usuário
        const [rows] = await connection.execute(
            'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Email ou senha inválidos' })
            };
        }

        const user = rows[0];

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Email ou senha inválidos' })
            };
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        // Sucesso
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            })
        };

    } catch (error) {
        console.error('Erro no login:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro interno do servidor',
                details: error.message
            })
        };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};
