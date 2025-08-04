// Consultar dados do Google Cloud SQL
const mysql = require('mysql2/promise');
require('dotenv').config();

async function consultarDados() {
    console.log('🔍 Consultando dados do Google Cloud SQL...\n');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Conectado ao Google Cloud SQL\n');
        
        // Verificar usuários
        console.log('👥 === USUÁRIOS NO BANCO ===');
        const [users] = await connection.execute('SELECT id, name, email, role, active, created_at FROM users');
        console.log(`Total: ${users.length} usuários`);
        users.forEach(user => {
            console.log(`  • ID: ${user.id} | ${user.name} | ${user.email} | ${user.role} | ${user.active ? 'Ativo' : 'Inativo'}`);
        });
        
        // Verificar salas
        console.log('\n🏢 === SALAS NO BANCO ===');
        const [rooms] = await connection.execute('SELECT id, name, capacity, location, active FROM rooms');
        console.log(`Total: ${rooms.length} salas`);
        rooms.forEach(room => {
            console.log(`  • ID: ${room.id} | ${room.name} | Capacidade: ${room.capacity} | Local: ${room.location}`);
        });
        
        // Verificar reuniões
        console.log('\n📅 === REUNIÕES NO BANCO ===');
        
        // Primeiro, verificar se há dados na tabela
        const [bookingCount] = await connection.execute('SELECT COUNT(*) as total FROM bookings');
        console.log(`Total: ${bookingCount[0].total} reuniões`);
        
        if (bookingCount[0].total > 0) {
            const [bookings] = await connection.execute(`
                SELECT b.id, b.title, b.start_time, b.end_time, r.name as room_name, u.name as user_name 
                FROM bookings b 
                LEFT JOIN rooms r ON b.room_id = r.id 
                LEFT JOIN users u ON b.user_id = u.id 
                ORDER BY b.start_time DESC 
                LIMIT 10
            `);
            
            bookings.forEach(booking => {
                const start = new Date(booking.start_time).toLocaleString('pt-BR');
                const end = new Date(booking.end_time).toLocaleString('pt-BR');
                console.log(`  • ${booking.title} | ${start} → ${end} | Sala: ${booking.room_name || 'N/A'} | Por: ${booking.user_name || 'N/A'}`);
            });
        } else {
            console.log('  Nenhuma reunião agendada ainda.');
        }
        
        await connection.end();
        console.log('\n✅ Consulta finalizada!');
        
    } catch (error) {
        console.error('❌ Erro ao consultar dados:', error.message);
    }
}

consultarDados();
