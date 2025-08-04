// ==================== NETLIFY FUNCTION: SALAS COM GOOGLE CLOUD SQL ====================

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

        console.log(`🏢 ${method} ${path} - ID: ${id || 'N/A'}`);

        switch (method) {
            case 'GET':
                if (id) {
                    return await getRoom(id);
                } else {
                    return await getRooms();
                }

            case 'POST':
                return await createRoom(body);

            case 'PUT':
                return await updateRoom(id, body);

            case 'DELETE':
                return await deleteRoom(id);

            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }

    } catch (error) {
        console.error('❌ Erro na function salas:', error);
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

// GET - Listar todas as salas
async function getRooms() {
    try {
        const rooms = await executeQuery(`
            SELECT 
                id, name, description, capacity, location, equipment, status,
                created_at, updated_at
            FROM rooms 
            WHERE status = 'active'
            ORDER BY name ASC
        `);

        // Parse equipment JSON
        const roomsWithEquipment = rooms.map(room => ({
            ...room,
            equipment: room.equipment ? JSON.parse(room.equipment) : []
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(roomsWithEquipment)
        };
    } catch (error) {
        throw new Error(`Erro ao buscar salas: ${error.message}`);
    }
}

// GET - Buscar sala por ID
async function getRoom(id) {
    try {
        const rooms = await executeQuery(`
            SELECT 
                id, name, description, capacity, location, equipment, status,
                created_at, updated_at
            FROM rooms 
            WHERE id = ? AND status = 'active'
        `, [id]);

        if (rooms.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Sala não encontrada' })
            };
        }

        const room = {
            ...rooms[0],
            equipment: rooms[0].equipment ? JSON.parse(rooms[0].equipment) : []
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(room)
        };
    } catch (error) {
        throw new Error(`Erro ao buscar sala: ${error.message}`);
    }
}

// POST - Criar nova sala
async function createRoom(roomData) {
    try {
        const { 
            name, 
            description = '', 
            capacity = 10, 
            location = '', 
            equipment = [] 
        } = roomData;

        if (!name) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nome da sala é obrigatório' })
            };
        }

        // Verificar se sala já existe
        const existingRooms = await executeQuery('SELECT id FROM rooms WHERE name = ?', [name]);
        if (existingRooms.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Sala com este nome já existe' })
            };
        }

        // Inserir sala
        const result = await executeQuery(`
            INSERT INTO rooms (name, description, capacity, location, equipment, status, created_at) 
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        `, [name, description, capacity, location, JSON.stringify(equipment)]);

        // Buscar sala criada
        const newRoom = await executeQuery(`
            SELECT id, name, description, capacity, location, equipment, status, created_at 
            FROM rooms WHERE id = ?
        `, [result.insertId]);

        const room = {
            ...newRoom[0],
            equipment: newRoom[0].equipment ? JSON.parse(newRoom[0].equipment) : []
        };

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(room)
        };
    } catch (error) {
        throw new Error(`Erro ao criar sala: ${error.message}`);
    }
}

// PUT - Atualizar sala
async function updateRoom(id, roomData) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID da sala é obrigatório' })
            };
        }

        const { name, description, capacity, location, equipment } = roomData;
        let query = 'UPDATE rooms SET updated_at = NOW()';
        let params = [];

        if (name) {
            // Verificar se nome já existe em outra sala
            const existingRooms = await executeQuery('SELECT id FROM rooms WHERE name = ? AND id != ?', [name, id]);
            if (existingRooms.length > 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Sala com este nome já existe' })
                };
            }
            query += ', name = ?';
            params.push(name);
        }

        if (description !== undefined) {
            query += ', description = ?';
            params.push(description);
        }

        if (capacity) {
            query += ', capacity = ?';
            params.push(capacity);
        }

        if (location !== undefined) {
            query += ', location = ?';
            params.push(location);
        }

        if (equipment) {
            query += ', equipment = ?';
            params.push(JSON.stringify(equipment));
        }

        query += ' WHERE id = ?';
        params.push(id);

        await executeQuery(query, params);

        // Buscar sala atualizada
        const updatedRoom = await executeQuery(`
            SELECT id, name, description, capacity, location, equipment, status, created_at, updated_at 
            FROM rooms WHERE id = ?
        `, [id]);

        if (updatedRoom.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Sala não encontrada' })
            };
        }

        const room = {
            ...updatedRoom[0],
            equipment: updatedRoom[0].equipment ? JSON.parse(updatedRoom[0].equipment) : []
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(room)
        };
    } catch (error) {
        throw new Error(`Erro ao atualizar sala: ${error.message}`);
    }
}

// DELETE - Excluir sala (soft delete)
async function deleteRoom(id) {
    try {
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID da sala é obrigatório' })
            };
        }

        // Verificar se há reuniões futuras agendadas
        const futureBookings = await executeQuery(`
            SELECT id FROM bookings 
            WHERE room_id = ? AND start_time > NOW() AND status = 'confirmed'
        `, [id]);

        if (futureBookings.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Não é possível excluir sala com reuniões agendadas',
                    futureBookings: futureBookings.length
                })
            };
        }

        // Soft delete - apenas marcar como inativa
        await executeQuery(`
            UPDATE rooms SET status = 'inactive', updated_at = NOW() 
            WHERE id = ?
        `, [id]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Sala excluída com sucesso' })
        };
    } catch (error) {
        throw new Error(`Erro ao excluir sala: ${error.message}`);
    }
}
