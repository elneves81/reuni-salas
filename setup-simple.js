// ==================== SETUP SIMPLES PARA GOOGLE CLOUD SQL ====================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;

    try {
        console.log('🔄 Conectando ao Google Cloud SQL...');
        
        // Conectar sem especificar database primeiro
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conectado ao MySQL!');

        // Usar o database
        console.log('🏗️ Selecionando database sala_livre...');
        await connection.execute('USE sala_livre');
        console.log('✅ Database selecionado!');

        // Criar tabela de usuários
        console.log('👥 Criando tabela users...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NULL,
                role ENUM('admin', 'manager', 'user') DEFAULT 'user',
                department VARCHAR(100) NULL,
                phone VARCHAR(20) NULL,
                auth_provider ENUM('local', 'google') DEFAULT 'local',
                google_id VARCHAR(255) NULL,
                avatar VARCHAR(500) NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL,
                login_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_role (role),
                INDEX idx_active (active)
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela users criada!');

        // Criar tabela de salas
        console.log('🏢 Criando tabela rooms...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                capacity INT NOT NULL DEFAULT 1,
                location VARCHAR(255) NULL,
                equipment TEXT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_active (active),
                INDEX idx_capacity (capacity)
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela rooms criada!');

        // Criar tabela de reservas
        console.log('📅 Criando tabela bookings...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                room_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NULL,
                start_datetime DATETIME NOT NULL,
                end_datetime DATETIME NOT NULL,
                status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
                participants TEXT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                
                INDEX idx_user_id (user_id),
                INDEX idx_room_id (room_id),
                INDEX idx_start_datetime (start_datetime),
                INDEX idx_status (status)
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela bookings criada!');

        // Inserir usuário admin
        console.log('👤 Inserindo usuário administrador...');
        
        // Verificar se admin já existe
        const [existingAdmin] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            ['admin@salalivre.com']
        );
        
        if (existingAdmin.length === 0) {
            await connection.execute(`
                INSERT INTO users (name, email, password, role, department, auth_provider, email_verified, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Administrador',
                'admin@salalivre.com',
                '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', // admin123
                'admin',
                'Administração',
                'local',
                true,
                true
            ]);
            console.log('✅ Usuário admin criado!');
        } else {
            console.log('ℹ️ Usuário admin já existe!');
        }

        // Inserir salas de exemplo
        console.log('🏢 Inserindo salas de exemplo...');
        
        const [existingRooms] = await connection.execute('SELECT COUNT(*) as count FROM rooms');
        
        if (existingRooms[0].count === 0) {
            const rooms = [
                ['Sala de Reunião A', 'Sala equipada com projetor e videoconferência', 8, 'Andar 1', 'Projetor, TV 55", Sistema de som'],
                ['Sala de Reunião B', 'Sala para reuniões menores', 4, 'Andar 1', 'TV 42", Quadro branco'],
                ['Auditório', 'Espaço para grandes apresentações', 50, 'Térreo', 'Projetor, Sistema de som, Microfone'],
                ['Sala de Treinamento', 'Sala para capacitações e workshops', 20, 'Andar 2', 'Projetor, Flipchart, Computadores']
            ];
            
            for (const room of rooms) {
                await connection.execute(`
                    INSERT INTO rooms (name, description, capacity, location, equipment)
                    VALUES (?, ?, ?, ?, ?)
                `, room);
            }
            console.log('✅ Salas de exemplo criadas!');
        } else {
            console.log('ℹ️ Salas já existem!');
        }

        console.log('\n🎉 Setup do banco concluído com sucesso!');
        console.log('\n📋 Informações de login:');
        console.log('   👤 Admin: admin@salalivre.com');
        console.log('   🔐 Senha: admin123');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Erro no setup do banco:', error.message);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

setupDatabase();
