// ==================== NETLIFY FUNCTION: USUÁRIOS COM GOOGLE CLOUD SQL ====================

const { executeQuery } = require('./db-utils');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Responder a OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const method = event.httpMethod;
        const path = event.path;
        const body = event.body ? JSON.parse(event.body) : {};
        const { id } = event.queryStringParameters || {};

        console.log(`🔗 ${method} ${path} - ID: ${id || 'N/A'}`);

        switch (method) {
            case 'GET':
                if (id) {
                    return await getUser(id);
                } else {
                    return await getUsers();
                }

            case 'POST':
                return await createUser(body);

            case 'PUT':
                return await updateUser(id, body);

            case 'DELETE':
                return await deleteUser(id);

            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }

    } catch (error) {
        console.error('❌ Erro na function usuários:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro interno do servidor',
                details: error.message 
            })
        };
    }
};

// GET - Listar todos os usuários
async function getUsers() {
    try {
        const users = await executeQuery(`
            SELECT 
                id, name, email, role, department, active as status, 
                created_at, updated_at, last_login as last_access
            FROM users 
            WHERE active = TRUE
            ORDER BY created_at DESC
        `);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(users)
        };
    } catch (error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
}

// GET - Buscar usuário por ID
async function getUser(id) {
    try {
        const users = await executeQuery(`
            SELECT 
                id, name, email, role, department, active as status, 
                created_at, updated_at, last_login as last_access
            FROM users 
            WHERE id = ? AND active = TRUE
        `, [id]);

        if (users.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Usuário não encontrado' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(users[0])
        };
    } catch (error) {
        throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }
}

// POST - Criar novo usuário
async function createUser(userData) {
    try {
        const { name, email, password, role = 'user', department = 'geral' } = userData;

        if (!name || !email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nome, email e senha são obrigatórios' })
            };
        }

        // Verificar se email já existe
        const existingUsers = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email já está em uso' })
            };
        }

        // Hash da senha (simples para Netlify Functions)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir usuário
        const result = await executeQuery(`
            INSERT INTO users (name, email, password, role, department, status, created_at) 
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        `, [name, email, hashedPassword, role, department]);

        // Buscar usuário criado
        const newUser = await executeQuery(`
            SELECT id, name, email, role, department, status, created_at 
            FROM users WHERE id = ?
        `, [result.insertId]);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newUser[0])
        };
    } catch (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
}

// PUT - Atualizar usuário
async function updateUser(id, userData) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID do usuário é obrigatório' })
            };
        }

        const { name, email, role, department, password } = userData;
        let query = 'UPDATE users SET updated_at = NOW()';
        let params = [];

        if (name) {
            query += ', name = ?';
            params.push(name);
        }

        if (email) {
            // Verificar se email já existe em outro usuário
            const existingUsers = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existingUsers.length > 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email já está em uso' })
                };
            }
            query += ', email = ?';
            params.push(email);
        }

        if (role) {
            query += ', role = ?';
            params.push(role);
        }

        if (department) {
            query += ', department = ?';
            params.push(department);
        }

        if (password) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await executeQuery(query, params);

        // Buscar usuário atualizado
        const updatedUser = await executeQuery(`
            SELECT id, name, email, role, department, status, created_at, updated_at 
            FROM users WHERE id = ?
        `, [id]);

        if (updatedUser.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Usuário não encontrado' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedUser[0])
        };
    } catch (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
}

// DELETE - Excluir usuário (soft delete)
async function deleteUser(id) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID do usuário é obrigatório' })
            };
        }

        // Soft delete - apenas marcar como inativo
        await executeQuery(`
            UPDATE users SET status = 'inactive', updated_at = NOW() 
            WHERE id = ?
        `, [id]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Usuário excluído com sucesso' })
        };
    } catch (error) {
        throw new Error(`Erro ao excluir usuário: ${error.message}`);
    }
}
