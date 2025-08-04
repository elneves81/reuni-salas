// ==================== NETLIFY FUNCTION: GOOGLE AUTH ====================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Responder a OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { googleToken, userData } = JSON.parse(event.body);
        
        console.log('🔐 Google Auth tentativa:', { email: userData.email });

        if (!userData || !userData.email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Dados do Google inválidos' 
                })
            };
        }

        // Configuração do banco
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
        const connection = await mysql.createConnection(dbConfig);

        // Verificar se usuário já existe (COLUNAS CORRETAS)
        const [users] = await connection.execute(`
            SELECT id, name, email, password, role, google_id
            FROM users 
            WHERE email = ?
            LIMIT 1
        `, [userData.email]);

        let user;

        if (users.length === 0) {
            // Criar novo usuário a partir dos dados do Google
            console.log('👤 Criando novo usuário via Google:', userData.email);
            
            // Gerar senha aleatória (usuário Google não precisará dela)
            const randomPassword = Math.random().toString(36).slice(-12);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            const [result] = await connection.execute(`
                INSERT INTO users (name, email, password, role, google_id, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                userData.name || userData.email.split('@')[0],
                userData.email,
                hashedPassword,
                'user', // Role padrão
                userData.sub || userData.id // Google ID
            ]);

            // Buscar usuário criado
            const [newUsers] = await connection.execute(`
                SELECT id, name, email, role, google_id
                FROM users 
                WHERE id = ?
            `, [result.insertId]);
            
            user = newUsers[0];
            console.log('✅ Usuário criado via Google:', user.id);

        } else {
            user = users[0];
            console.log('✅ Usuário existente logado via Google:', user.id);
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                provider: 'google'
            },
            process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        console.log('✅ Google Auth bem-sucedido:', userData.email);

        // Fechar conexão
        await connection.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login Google realizado com sucesso',
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    provider: 'google',
                    picture: userData.picture || null
                }
            })
        };

    } catch (error) {
        console.error('❌ Erro no Google Auth:', error);
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
