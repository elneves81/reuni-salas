// ==================== NETLIFY FUNCTION: REUNIÕES COM GOOGLE CLOUD SQL ====================

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

        console.log(`📅 ${method} ${path} - ID: ${id || 'N/A'}`);

        switch (method) {
            case 'GET':
                if (id) {
                    return await getBooking(id);
                } else {
                    return await getBookings();
                }

            case 'POST':
                return await createBooking(body);

            case 'PUT':
                return await updateBooking(id, body);

            case 'DELETE':
                return await deleteBooking(id);

            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }

    } catch (error) {
        console.error('❌ Erro na function reuniões:', error);
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

// GET - Listar todas as reuniões
async function getBookings() {
    try {
        const bookings = await executeQuery(`
            SELECT 
                b.id, b.title, b.description, b.start_time, b.end_time, b.status,
                b.created_at, b.updated_at,
                r.name as room_name, r.id as room_id,
                u.name as user_name, u.id as user_id
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.status IN ('confirmed', 'pending')
            ORDER BY b.start_time ASC
        `);

        // Converter para formato FullCalendar
        const events = bookings.map(booking => ({
            id: booking.id,
            title: booking.title,
            description: booking.description,
            start: booking.start_time,
            end: booking.end_time,
            backgroundColor: booking.status === 'confirmed' ? '#22c55e' : '#f59e0b',
            extendedProps: {
                room_id: booking.room_id,
                room_name: booking.room_name,
                user_id: booking.user_id,
                user_name: booking.user_name,
                status: booking.status
            }
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(events)
        };
    } catch (error) {
        throw new Error(`Erro ao buscar reuniões: ${error.message}`);
    }
}

// GET - Buscar reunião por ID
async function getBooking(id) {
    try {
        const bookings = await executeQuery(`
            SELECT 
                b.id, b.title, b.description, b.start_time, b.end_time, b.status,
                b.created_at, b.updated_at,
                r.name as room_name, r.id as room_id,
                u.name as user_name, u.id as user_id
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [id]);

        if (bookings.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Reunião não encontrada' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(bookings[0])
        };
    } catch (error) {
        throw new Error(`Erro ao buscar reunião: ${error.message}`);
    }
}

// POST - Criar nova reunião
async function createBooking(bookingData) {
    try {
        const { 
            title, 
            description = '', 
            start_time, 
            end_time, 
            room_id = 1, 
            user_id = 1 
        } = bookingData;

        if (!title || !start_time || !end_time) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Título, data/hora início e fim são obrigatórios' })
            };
        }

        // Verificar conflitos de horário
        const conflicts = await executeQuery(`
            SELECT id FROM bookings 
            WHERE room_id = ? 
            AND status = 'confirmed'
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [room_id, start_time, start_time, end_time, end_time, start_time, end_time]);

        if (conflicts.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Conflito de horário - sala já ocupada neste período' })
            };
        }

        // Inserir reunião
        const result = await executeQuery(`
            INSERT INTO bookings (title, description, start_time, end_time, room_id, user_id, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NOW())
        `, [title, description, start_time, end_time, room_id, user_id]);

        // Buscar reunião criada
        const newBooking = await executeQuery(`
            SELECT 
                b.id, b.title, b.description, b.start_time, b.end_time, b.status,
                r.name as room_name, u.name as user_name
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [result.insertId]);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newBooking[0])
        };
    } catch (error) {
        throw new Error(`Erro ao criar reunião: ${error.message}`);
    }
}

// PUT - Atualizar reunião
async function updateBooking(id, bookingData) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID da reunião é obrigatório' })
            };
        }

        const { title, description, start_time, end_time, room_id, status } = bookingData;
        let query = 'UPDATE bookings SET updated_at = NOW()';
        let params = [];

        if (title) {
            query += ', title = ?';
            params.push(title);
        }

        if (description !== undefined) {
            query += ', description = ?';
            params.push(description);
        }

        if (start_time) {
            query += ', start_time = ?';
            params.push(start_time);
        }

        if (end_time) {
            query += ', end_time = ?';
            params.push(end_time);
        }

        if (room_id) {
            query += ', room_id = ?';
            params.push(room_id);
        }

        if (status) {
            query += ', status = ?';
            params.push(status);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await executeQuery(query, params);

        // Buscar reunião atualizada
        const updatedBooking = await executeQuery(`
            SELECT 
                b.id, b.title, b.description, b.start_time, b.end_time, b.status,
                r.name as room_name, u.name as user_name
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [id]);

        if (updatedBooking.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Reunião não encontrada' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedBooking[0])
        };
    } catch (error) {
        throw new Error(`Erro ao atualizar reunião: ${error.message}`);
    }
}

// DELETE - Excluir reunião
async function deleteBooking(id) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID da reunião é obrigatório' })
            };
        }

        // Soft delete - marcar como cancelada
        await executeQuery(`
            UPDATE bookings SET status = 'cancelled', updated_at = NOW() 
            WHERE id = ?
        `, [id]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Reunião excluída com sucesso' })
        };
    } catch (error) {
        throw new Error(`Erro ao excluir reunião: ${error.message}`);
    }
}
