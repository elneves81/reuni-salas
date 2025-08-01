// ==================== NETLIFY FUNCTION: REGISTER ====================
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
        const { name, email, password } = JSON.parse(event.body);

        // Validações básicas
        if (!name || name.length < 2) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Nome deve ter pelo menos 2 caracteres' 
                })
            };
        }

        if (!email || !email.includes('@')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'E-mail inválido' 
                })
            };
        }

        if (!password || password.length < 6) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Senha deve ter pelo menos 6 caracteres' 
                })
            };
        }

        // Conectar ao banco Google Cloud SQL
        const connection = await mysql.createConnection({
            host: '34.45.56.79',
            user: 'app_user',
            password: 'Neves@2025',
            database: 'sala_livre',
            port: 3306
        });

        // Verificar se email já existe
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.end();
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'E-mail já está em uso' 
                })
            };
        }

        // Hash da senha
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Inserir usuário
        const [result] = await connection.execute(`
            INSERT INTO users (name, email, password, role, auth_provider, email_verified, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            name.trim(),
            email.toLowerCase().trim(),
            hashedPassword,
            'user',
            'local',
            false,
            true
        ]);

        await connection.end();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Conta criada com sucesso! Você pode fazer login agora.',
                userId: result.insertId
            })
        };

    } catch (error) {
        console.error('Erro no registro:', error);
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
