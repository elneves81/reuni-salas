// ==================== IMPORTS ====================
const express = require('express');
const router = express.Router();
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

// ==================== ROTAS DE SALAS ====================

// 📋 LISTAR SALAS
router.get('/', verifyToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [rooms] = await connection.execute(`
            SELECT 
                id, name, description, capacity, location, 
                equipment, amenities, color, image, active, 
                created_at, updated_at
            FROM rooms 
            WHERE active = TRUE
            ORDER BY name ASC
        `);
        
        await connection.end();
        
        // Parse JSON fields
        const parsedRooms = rooms.map(room => ({
            ...room,
            equipment: room.equipment ? JSON.parse(room.equipment) : [],
            amenities: room.amenities ? JSON.parse(room.amenities) : []
        }));
        
        res.json({
            success: true,
            data: parsedRooms,
            total: parsedRooms.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar salas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar salas'
        });
    }
});

// 👁️ BUSCAR SALA POR ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        const [rooms] = await connection.execute(`
            SELECT 
                id, name, description, capacity, location, 
                equipment, amenities, color, image, active, 
                created_at, updated_at
            FROM rooms 
            WHERE id = ? AND active = TRUE
        `, [id]);
        
        await connection.end();
        
        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }
        
        const room = rooms[0];
        room.equipment = room.equipment ? JSON.parse(room.equipment) : [];
        room.amenities = room.amenities ? JSON.parse(room.amenities) : [];
        
        res.json({
            success: true,
            data: room
        });
        
    } catch (error) {
        console.error('Erro ao buscar sala:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar sala'
        });
    }
});

// ➕ CRIAR SALA (somente admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { 
            name, 
            description, 
            capacity = 1, 
            location, 
            equipment = [], 
            amenities = [], 
            color = '#22c55e',
            image 
        } = req.body;
        
        // Validação básica
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome da sala é obrigatório'
            });
        }
        
        if (capacity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Capacidade deve ser pelo menos 1'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se nome já existe
        const [existingRooms] = await connection.execute(
            'SELECT id FROM rooms WHERE name = ? AND active = TRUE',
            [name]
        );
        
        if (existingRooms.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'Já existe uma sala com este nome'
            });
        }
        
        // Criar sala
        const [result] = await connection.execute(`
            INSERT INTO rooms (name, description, capacity, location, equipment, amenities, color, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, 
            description, 
            capacity, 
            location, 
            JSON.stringify(equipment), 
            JSON.stringify(amenities), 
            color, 
            image
        ]);
        
        // Buscar sala criada
        const [newRoom] = await connection.execute(`
            SELECT 
                id, name, description, capacity, location, 
                equipment, amenities, color, image, active, created_at
            FROM rooms 
            WHERE id = ?
        `, [result.insertId]);
        
        await connection.end();
        
        const room = newRoom[0];
        room.equipment = room.equipment ? JSON.parse(room.equipment) : [];
        room.amenities = room.amenities ? JSON.parse(room.amenities) : [];
        
        res.status(201).json({
            success: true,
            message: 'Sala criada com sucesso',
            data: room
        });
        
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar sala'
        });
    }
});

// ✏️ ATUALIZAR SALA (somente admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            description, 
            capacity, 
            location, 
            equipment, 
            amenities, 
            color, 
            image, 
            active 
        } = req.body;
        
        const updateFields = [];
        const updateValues = [];
        
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        
        if (capacity && capacity >= 1) {
            updateFields.push('capacity = ?');
            updateValues.push(capacity);
        }
        
        if (location !== undefined) {
            updateFields.push('location = ?');
            updateValues.push(location);
        }
        
        if (equipment) {
            updateFields.push('equipment = ?');
            updateValues.push(JSON.stringify(equipment));
        }
        
        if (amenities) {
            updateFields.push('amenities = ?');
            updateValues.push(JSON.stringify(amenities));
        }
        
        if (color) {
            updateFields.push('color = ?');
            updateValues.push(color);
        }
        
        if (image !== undefined) {
            updateFields.push('image = ?');
            updateValues.push(image);
        }
        
        if (typeof active === 'boolean') {
            updateFields.push('active = ?');
            updateValues.push(active);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        
        updateValues.push(id);
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se nome já existe (se está sendo alterado)
        if (name) {
            const [existingRooms] = await connection.execute(
                'SELECT id FROM rooms WHERE name = ? AND id != ? AND active = TRUE',
                [name, id]
            );
            
            if (existingRooms.length > 0) {
                await connection.end();
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma sala com este nome'
                });
            }
        }
        
        // Atualizar sala
        await connection.execute(`
            UPDATE rooms 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, updateValues);
        
        // Buscar sala atualizada
        const [updatedRoom] = await connection.execute(`
            SELECT 
                id, name, description, capacity, location, 
                equipment, amenities, color, image, active, 
                created_at, updated_at
            FROM rooms 
            WHERE id = ?
        `, [id]);
        
        await connection.end();
        
        if (updatedRoom.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }
        
        const room = updatedRoom[0];
        room.equipment = room.equipment ? JSON.parse(room.equipment) : [];
        room.amenities = room.amenities ? JSON.parse(room.amenities) : [];
        
        res.json({
            success: true,
            message: 'Sala atualizada com sucesso',
            data: room
        });
        
    } catch (error) {
        console.error('Erro ao atualizar sala:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar sala'
        });
    }
});

// 🗑️ EXCLUIR SALA (somente admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se sala existe
        const [existingRoom] = await connection.execute(
            'SELECT id, name FROM rooms WHERE id = ?',
            [id]
        );
        
        if (existingRoom.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }
        
        // Verificar se há reservas futuras
        const [futureBookings] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE room_id = ? 
            AND end_time > NOW() 
            AND status = 'confirmed'
        `, [id]);
        
        if (futureBookings[0].count > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: `Não é possível excluir a sala "${existingRoom[0].name}" pois há ${futureBookings[0].count} reserva(s) futura(s)`
            });
        }
        
        // Desativar sala em vez de excluir (soft delete)
        await connection.execute(
            'UPDATE rooms SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [id]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Sala "${existingRoom[0].name}" foi desativada com sucesso`
        });
        
    } catch (error) {
        console.error('Erro ao excluir sala:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir sala'
        });
    }
});

// 📊 ESTATÍSTICAS DA SALA
router.get('/:id/stats', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Estatísticas dos últimos 30 dias
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                AVG(TIMESTAMPDIFF(HOUR, start_time, end_time)) as avg_duration_hours
            FROM bookings 
            WHERE room_id = ? 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [id]);
        
        // Top usuários
        const [topUsers] = await connection.execute(`
            SELECT 
                u.name,
                COUNT(*) as booking_count
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.room_id = ? 
            AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND b.status = 'confirmed'
            GROUP BY u.id
            ORDER BY booking_count DESC
            LIMIT 5
        `, [id]);
        
        await connection.end();
        
        res.json({
            success: true,
            data: {
                summary: stats[0],
                topUsers
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

module.exports = router;
