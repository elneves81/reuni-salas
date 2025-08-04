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

// Função para verificar conflitos de horário
async function checkTimeConflict(roomId, startTime, endTime, excludeBookingId = null) {
    const connection = await mysql.createConnection(dbConfig);
    
    let query = `
        SELECT id, title, start_time, end_time
        FROM bookings 
        WHERE room_id = ? 
        AND status = 'confirmed'
        AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
        )
    `;
    
    let params = [roomId, endTime, startTime, startTime, endTime, startTime, endTime];
    
    if (excludeBookingId) {
        query += ' AND id != ?';
        params.push(excludeBookingId);
    }
    
    const [conflicts] = await connection.execute(query, params);
    await connection.end();
    
    return conflicts;
}

// ==================== ROTAS DE RESERVAS ====================

// 📋 LISTAR RESERVAS
router.get('/', verifyToken, async (req, res) => {
    try {
        const { 
            room_id, 
            user_id, 
            start_date, 
            end_date, 
            status = 'confirmed',
            limit = 100,
            offset = 0 
        } = req.query;
        
        let whereConditions = [];
        let queryParams = [];
        
        // Filtros
        if (room_id) {
            whereConditions.push('b.room_id = ?');
            queryParams.push(room_id);
        }
        
        if (user_id) {
            whereConditions.push('b.user_id = ?');
            queryParams.push(user_id);
        }
        
        if (start_date) {
            whereConditions.push('b.start_time >= ?');
            queryParams.push(start_date);
        }
        
        if (end_date) {
            whereConditions.push('b.end_time <= ?');
            queryParams.push(end_date);
        }
        
        if (status && status !== 'all') {
            whereConditions.push('b.status = ?');
            queryParams.push(status);
        }
        
        // Se não for admin, mostrar apenas reservas próprias
        if (req.user.role !== 'admin') {
            whereConditions.push('b.user_id = ?');
            queryParams.push(req.user.id);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [bookings] = await connection.execute(`
            SELECT 
                b.id, b.title, b.description, b.start_time, b.end_time, 
                b.all_day, b.recurring, b.recurring_until, b.attendees, 
                b.status, b.priority, b.notes, b.created_at, b.updated_at,
                r.name as room_name, r.color as room_color,
                u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            ${whereClause}
            ORDER BY b.start_time ASC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);
        
        await connection.end();
        
        // Parse JSON fields
        const parsedBookings = bookings.map(booking => ({
            ...booking,
            attendees: booking.attendees ? JSON.parse(booking.attendees) : []
        }));
        
        res.json({
            success: true,
            data: parsedBookings,
            total: parsedBookings.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar reservas'
        });
    }
});

// 👁️ BUSCAR RESERVA POR ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT 
                b.id, b.title, b.description, b.room_id, b.user_id,
                b.start_time, b.end_time, b.all_day, b.recurring, 
                b.recurring_until, b.attendees, b.status, b.priority, 
                b.notes, b.created_at, b.updated_at,
                r.name as room_name, r.color as room_color,
                u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `;
        
        let params = [id];
        
        // Se não for admin, verificar se é o dono da reserva
        if (req.user.role !== 'admin') {
            query += ' AND b.user_id = ?';
            params.push(req.user.id);
        }
        
        const [bookings] = await connection.execute(query, params);
        
        await connection.end();
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva não encontrada'
            });
        }
        
        const booking = bookings[0];
        booking.attendees = booking.attendees ? JSON.parse(booking.attendees) : [];
        
        res.json({
            success: true,
            data: booking
        });
        
    } catch (error) {
        console.error('Erro ao buscar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar reserva'
        });
    }
});

// ➕ CRIAR RESERVA
router.post('/', verifyToken, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            room_id, 
            start_time, 
            end_time, 
            all_day = false,
            recurring = 'none',
            recurring_until,
            attendees = [],
            priority = 'medium',
            notes 
        } = req.body;
        
        // Validação básica
        if (!title || !room_id || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Título, sala, horário de início e fim são obrigatórios'
            });
        }
        
        // Validar horários
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'Horário de início deve ser anterior ao horário de fim'
            });
        }
        
        if (startDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível criar reservas no passado'
            });
        }
        
        // Verificar se a sala existe
        const connection = await mysql.createConnection(dbConfig);
        
        const [rooms] = await connection.execute(
            'SELECT id, name FROM rooms WHERE id = ? AND active = TRUE',
            [room_id]
        );
        
        if (rooms.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }
        
        // Verificar conflitos de horário
        const conflicts = await checkTimeConflict(room_id, start_time, end_time);
        
        if (conflicts.length > 0) {
            await connection.end();
            return res.status(409).json({
                success: false,
                message: `Conflito de horário com a reserva "${conflicts[0].title}"`,
                conflict: conflicts[0]
            });
        }
        
        // Criar reserva
        const [result] = await connection.execute(`
            INSERT INTO bookings (
                title, description, room_id, user_id, start_time, end_time, 
                all_day, recurring, recurring_until, attendees, priority, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, description, room_id, req.user.id, start_time, end_time,
            all_day, recurring, recurring_until, JSON.stringify(attendees), priority, notes
        ]);
        
        // Buscar reserva criada
        const [newBooking] = await connection.execute(`
            SELECT 
                b.id, b.title, b.description, b.room_id, b.user_id,
                b.start_time, b.end_time, b.all_day, b.recurring, 
                b.recurring_until, b.attendees, b.status, b.priority, 
                b.notes, b.created_at,
                r.name as room_name, r.color as room_color,
                u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [result.insertId]);
        
        await connection.end();
        
        const booking = newBooking[0];
        booking.attendees = booking.attendees ? JSON.parse(booking.attendees) : [];
        
        res.status(201).json({
            success: true,
            message: 'Reserva criada com sucesso',
            data: booking
        });
        
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar reserva'
        });
    }
});

// ✏️ ATUALIZAR RESERVA
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            description, 
            room_id, 
            start_time, 
            end_time, 
            all_day,
            recurring,
            recurring_until,
            attendees,
            status,
            priority,
            notes 
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se reserva existe e se usuário tem permissão
        let checkQuery = 'SELECT * FROM bookings WHERE id = ?';
        let checkParams = [id];
        
        if (req.user.role !== 'admin') {
            checkQuery += ' AND user_id = ?';
            checkParams.push(req.user.id);
        }
        
        const [existingBooking] = await connection.execute(checkQuery, checkParams);
        
        if (existingBooking.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Reserva não encontrada ou sem permissão'
            });
        }
        
        const booking = existingBooking[0];
        
        // Não permitir editar reservas já iniciadas
        if (new Date(booking.start_time) < new Date() && req.user.role !== 'admin') {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar reservas já iniciadas'
            });
        }
        
        const updateFields = [];
        const updateValues = [];
        
        if (title) {
            updateFields.push('title = ?');
            updateValues.push(title);
        }
        
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        
        if (room_id) {
            // Verificar se nova sala existe
            const [rooms] = await connection.execute(
                'SELECT id FROM rooms WHERE id = ? AND active = TRUE',
                [room_id]
            );
            
            if (rooms.length === 0) {
                await connection.end();
                return res.status(404).json({
                    success: false,
                    message: 'Nova sala não encontrada'
                });
            }
            
            updateFields.push('room_id = ?');
            updateValues.push(room_id);
        }
        
        if (start_time) {
            updateFields.push('start_time = ?');
            updateValues.push(start_time);
        }
        
        if (end_time) {
            updateFields.push('end_time = ?');
            updateValues.push(end_time);
        }
        
        // Verificar conflitos se horário ou sala mudaram
        if (start_time || end_time || room_id) {
            const newStartTime = start_time || booking.start_time;
            const newEndTime = end_time || booking.end_time;
            const newRoomId = room_id || booking.room_id;
            
            // Validar novos horários
            if (new Date(newStartTime) >= new Date(newEndTime)) {
                await connection.end();
                return res.status(400).json({
                    success: false,
                    message: 'Horário de início deve ser anterior ao horário de fim'
                });
            }
            
            const conflicts = await checkTimeConflict(newRoomId, newStartTime, newEndTime, id);
            
            if (conflicts.length > 0) {
                await connection.end();
                return res.status(409).json({
                    success: false,
                    message: `Conflito de horário com a reserva "${conflicts[0].title}"`,
                    conflict: conflicts[0]
                });
            }
        }
        
        if (typeof all_day === 'boolean') {
            updateFields.push('all_day = ?');
            updateValues.push(all_day);
        }
        
        if (recurring) {
            updateFields.push('recurring = ?');
            updateValues.push(recurring);
        }
        
        if (recurring_until !== undefined) {
            updateFields.push('recurring_until = ?');
            updateValues.push(recurring_until);
        }
        
        if (attendees) {
            updateFields.push('attendees = ?');
            updateValues.push(JSON.stringify(attendees));
        }
        
        if (status && req.user.role === 'admin') {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        
        if (priority) {
            updateFields.push('priority = ?');
            updateValues.push(priority);
        }
        
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes);
        }
        
        if (updateFields.length === 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        
        updateValues.push(id);
        
        // Atualizar reserva
        await connection.execute(`
            UPDATE bookings 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, updateValues);
        
        // Buscar reserva atualizada
        const [updatedBooking] = await connection.execute(`
            SELECT 
                b.id, b.title, b.description, b.room_id, b.user_id,
                b.start_time, b.end_time, b.all_day, b.recurring, 
                b.recurring_until, b.attendees, b.status, b.priority, 
                b.notes, b.created_at, b.updated_at,
                r.name as room_name, r.color as room_color,
                u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [id]);
        
        await connection.end();
        
        const updatedBookingData = updatedBooking[0];
        updatedBookingData.attendees = updatedBookingData.attendees ? JSON.parse(updatedBookingData.attendees) : [];
        
        res.json({
            success: true,
            message: 'Reserva atualizada com sucesso',
            data: updatedBookingData
        });
        
    } catch (error) {
        console.error('Erro ao atualizar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar reserva'
        });
    }
});

// 🗑️ CANCELAR RESERVA
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se reserva existe e se usuário tem permissão
        let checkQuery = `
            SELECT b.*, r.name as room_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
        `;
        let checkParams = [id];
        
        if (req.user.role !== 'admin') {
            checkQuery += ' AND b.user_id = ?';
            checkParams.push(req.user.id);
        }
        
        const [existingBooking] = await connection.execute(checkQuery, checkParams);
        
        if (existingBooking.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Reserva não encontrada ou sem permissão'
            });
        }
        
        const booking = existingBooking[0];
        
        // Cancelar reserva (soft delete)
        await connection.execute(
            'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Reserva "${booking.title}" na sala "${booking.room_name}" foi cancelada com sucesso`
        });
        
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar reserva'
        });
    }
});

// 📊 ESTATÍSTICAS GERAIS
router.get('/stats/overview', verifyToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Estatísticas gerais
        const [totalStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                COUNT(CASE WHEN start_time >= CURDATE() THEN 1 END) as future_bookings
            FROM bookings
        `);
        
        // Reservas por sala (últimos 30 dias)
        const [roomStats] = await connection.execute(`
            SELECT 
                r.name as room_name,
                COUNT(*) as booking_count
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND b.status = 'confirmed'
            GROUP BY r.id
            ORDER BY booking_count DESC
            LIMIT 5
        `);
        
        // Usuários mais ativos (últimos 30 dias)
        const [userStats] = await connection.execute(`
            SELECT 
                u.name as user_name,
                COUNT(*) as booking_count
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND b.status = 'confirmed'
            GROUP BY u.id
            ORDER BY booking_count DESC
            LIMIT 5
        `);
        
        await connection.end();
        
        res.json({
            success: true,
            data: {
                overview: totalStats[0],
                topRooms: roomStats,
                topUsers: userStats
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
