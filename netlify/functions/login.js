// ==================== NETLIFY FUNCTION: LOGIN COM GOOGLE CLOUD SQL ====================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuração direta do banco para garantir funcionamento
const dbConfig = {
    host: process.env.DB_HOST || '35.184.206.243',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Neves2025@',
    database: process.env.DB_NAME || 'reuni-dep',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: {
        rejectUnauthorized: false
    },
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
};

// Função para executar queries
async function executeQuery(query, params = []) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        return rows;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

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

        // Buscar usuário no banco Google Cloud SQL (CORRIGIDO - colunas que existem)
        const users = await executeQuery(`
            SELECT id, name, email, password, role, google_id
            FROM users 
            WHERE email = ?
            LIMIT 1
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
                    role: user.role
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
