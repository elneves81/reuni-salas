// ==================== IMPORTS ====================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// ==================== CONFIGURAÇÃO DO BANCO ====================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sala_livre'
};

// ==================== MIDDLEWARES ====================
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acesso requerido'
        });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso restrito a administradores'
        });
    }
    next();
}

// ==================== ROTAS DE USUÁRIOS ====================

// 📋 LISTAR USUÁRIOS (somente admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [users] = await connection.execute(`
            SELECT 
                id, name, email, role, department, phone, 
                auth_provider, email_verified, active, 
                last_login, login_count, created_at, updated_at
            FROM users 
            ORDER BY name ASC
        `);
        
        await connection.end();
        
        res.json({
            success: true,
            data: users,
            total: users.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários'
        });
    }
});

// 👤 BUSCAR USUÁRIO POR ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Apenas admin ou o próprio usuário pode ver os dados
        if (req.user.role !== 'admin' && req.user.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [users] = await connection.execute(`
            SELECT 
                id, name, email, role, department, phone, 
                auth_provider, email_verified, active, 
                last_login, login_count, created_at, updated_at
            FROM users 
            WHERE id = ?
        `, [id]);
        
        await connection.end();
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuário'
        });
    }
});

// ➕ CRIAR USUÁRIO (somente admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role = 'user', department, phone } = req.body;
        
        // Validação básica
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nome e email são obrigatórios'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se email já existe
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'Email já está em uso'
            });
        }
        
        // Hash da senha se fornecida
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }
        
        // Criar usuário
        const [result] = await connection.execute(`
            INSERT INTO users (name, email, password, role, department, phone) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, email, hashedPassword, role, department, phone]);
        
        // Buscar usuário criado
        const [newUser] = await connection.execute(`
            SELECT 
                id, name, email, role, department, phone, 
                auth_provider, email_verified, active, created_at
            FROM users 
            WHERE id = ?
        `, [result.insertId]);
        
        await connection.end();
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: newUser[0]
        });
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar usuário'
        });
    }
});

// ✏️ ATUALIZAR USUÁRIO
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, department, phone, active } = req.body;
        
        // Apenas admin ou o próprio usuário pode atualizar
        if (req.user.role !== 'admin' && req.user.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }
        
        // Usuários comuns não podem alterar role ou status
        const updateFields = [];
        const updateValues = [];
        
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        
        if (department) {
            updateFields.push('department = ?');
            updateValues.push(department);
        }
        
        if (phone) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        
        // Apenas admin pode alterar role e status
        if (req.user.role === 'admin') {
            if (role) {
                updateFields.push('role = ?');
                updateValues.push(role);
            }
            
            if (typeof active === 'boolean') {
                updateFields.push('active = ?');
                updateValues.push(active);
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        
        updateValues.push(id);
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se email já existe (se está sendo alterado)
        if (email) {
            const [existingUsers] = await connection.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            
            if (existingUsers.length > 0) {
                await connection.end();
                return res.status(400).json({
                    success: false,
                    message: 'Email já está em uso por outro usuário'
                });
            }
        }
        
        // Atualizar usuário
        await connection.execute(`
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, updateValues);
        
        // Buscar usuário atualizado
        const [updatedUser] = await connection.execute(`
            SELECT 
                id, name, email, role, department, phone, 
                auth_provider, email_verified, active, 
                last_login, login_count, created_at, updated_at
            FROM users 
            WHERE id = ?
        `, [id]);
        
        await connection.end();
        
        if (updatedUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: updatedUser[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar usuário'
        });
    }
});

// 🗑️ EXCLUIR USUÁRIO (somente admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Não permitir que admin delete a si mesmo
        if (req.user.id == id) {
            return res.status(400).json({
                success: false,
                message: 'Você não pode excluir sua própria conta'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se usuário existe
        const [existingUser] = await connection.execute(
            'SELECT id, name FROM users WHERE id = ?',
            [id]
        );
        
        if (existingUser.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        // Excluir usuário (as reservas serão excluídas automaticamente devido ao CASCADE)
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Usuário "${existingUser[0].name}" foi excluído com sucesso`
        });
        
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir usuário'
        });
    }
});

// 🔑 ALTERAR SENHA
router.put('/:id/password', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        
        // Apenas o próprio usuário pode alterar sua senha
        if (req.user.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Você só pode alterar sua própria senha'
            });
        }
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Buscar usuário atual
        const [user] = await connection.execute(
            'SELECT password FROM users WHERE id = ?',
            [id]
        );
        
        if (user.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        // Verificar senha atual (se o usuário tem senha)
        if (user[0].password && currentPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
            if (!isValidPassword) {
                await connection.end();
                return res.status(400).json({
                    success: false,
                    message: 'Senha atual incorreta'
                });
            }
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Atualizar senha
        await connection.execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, id]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar senha'
        });
    }
});

module.exports = router;
