// ==================== NETLIFY FUNCTION: GOOGLE AUTH ====================

const { executeQuery } = require('./db-utils');
const bcrypt = require('bcryptjs');

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

        // Verificar se usuário já existe
        let users = await executeQuery(`
            SELECT id, name, email, password, role, department, active, last_login
            FROM users 
            WHERE email = ? AND active = TRUE
        `, [userData.email]);

        let user;

        if (users.length === 0) {
            // Criar novo usuário a partir dos dados do Google
            console.log('👤 Criando novo usuário via Google:', userData.email);
            
            // Gerar senha aleatória (usuário Google não precisará dela)
            const randomPassword = Math.random().toString(36).slice(-12);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            const result = await executeQuery(`
                INSERT INTO users (name, email, password, role, department, active, created_at, google_id) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
            `, [
                userData.name || userData.email.split('@')[0],
                userData.email,
                hashedPassword,
                'user', // Role padrão
                'geral', // Departamento padrão
                true,
                userData.sub || userData.id // Google ID
            ]);

            // Buscar usuário criado
            users = await executeQuery(`
                SELECT id, name, email, role, department, active
                FROM users 
                WHERE id = ?
            `, [result.insertId]);
            
            user = users[0];
            console.log('✅ Usuário criado via Google:', user.id);

        } else {
            user = users[0];
            console.log('✅ Usuário existente logado via Google:', user.id);
        }

        // Atualizar último login
        await executeQuery(`
            UPDATE users SET last_login = NOW() WHERE id = ?
        `, [user.id]);

        // Gerar token JWT
        const token = Buffer.from(JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            provider: 'google',
            timestamp: Date.now()
        })).toString('base64');

        console.log('✅ Google Auth bem-sucedido:', userData.email);

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
