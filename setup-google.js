// ==================== SETUP DIRETO PARA GOOGLE CLOUD SQL ====================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupGoogleCloudDatabase() {
    let connection;

    try {
        console.log('🔄 Conectando ao Google Cloud SQL...');
        
        // Conectar diretamente ao database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conectado ao MySQL!');

        // Criar tabela de usuários
        console.log('👥 Criando tabela users...');
        await connection.query(`
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela users criada!');

        // Criar índices para users
        console.log('🔗 Criando índices para users...');
        try {
            await connection.query('CREATE INDEX idx_email ON users(email)');
        } catch (e) { /* índice pode já existir */ }
        try {
            await connection.query('CREATE INDEX idx_role ON users(role)');
        } catch (e) { /* índice pode já existir */ }
        try {
            await connection.query('CREATE INDEX idx_active ON users(active)');
        } catch (e) { /* índice pode já existir */ }

        // Criar tabela de salas
        console.log('🏢 Criando tabela rooms...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                capacity INT NOT NULL DEFAULT 1,
                location VARCHAR(255) NULL,
                equipment TEXT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela rooms criada!');

        // Criar tabela de reservas
        console.log('📅 Criando tabela bookings...');
        await connection.query(`
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        console.log('✅ Tabela bookings criada!');

        // Adicionar foreign keys
        console.log('🔗 Criando relacionamentos...');
        try {
            await connection.query(`
                ALTER TABLE bookings 
                ADD CONSTRAINT fk_bookings_user 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `);
        } catch (e) {
            console.log('ℹ️ Foreign key users já existe');
        }
        
        try {
            await connection.query(`
                ALTER TABLE bookings 
                ADD CONSTRAINT fk_bookings_room 
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
            `);
        } catch (e) {
            console.log('ℹ️ Foreign key rooms já existe');
        }

        // Verificar se admin já existe
        console.log('👤 Verificando usuário administrador...');
        const [existingAdmin] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            ['admin@salalivre.com']
        );
        
        if (existingAdmin.length === 0) {
            console.log('➕ Inserindo usuário administrador...');
            await connection.query(`
                INSERT INTO users (name, email, password, role, department, auth_provider, email_verified, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Administrador',
                'admin@salalivre.com',
                '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', // admin123
                'admin',
                'Administração',
                'local',
                1,
                1
            ]);
            console.log('✅ Usuário admin criado!');
        } else {
            console.log('ℹ️ Usuário admin já existe!');
        }

        // Verificar se existem salas
        console.log('🏢 Verificando salas...');
        const [existingRooms] = await connection.query('SELECT COUNT(*) as count FROM rooms');
        
        if (existingRooms[0].count === 0) {
            console.log('➕ Inserindo salas de exemplo...');
            
            const rooms = [
                ['Sala de Reunião A', 'Sala equipada com projetor e videoconferência', 8, 'Andar 1', 'Projetor, TV 55", Sistema de som'],
                ['Sala de Reunião B', 'Sala para reuniões menores', 4, 'Andar 1', 'TV 42", Quadro branco'],
                ['Auditório', 'Espaço para grandes apresentações', 50, 'Térreo', 'Projetor, Sistema de som, Microfone'],
                ['Sala de Treinamento', 'Sala para capacitações e workshops', 20, 'Andar 2', 'Projetor, Flipchart, Computadores']
            ];
            
            for (const room of rooms) {
                await connection.query(`
                    INSERT INTO rooms (name, description, capacity, location, equipment)
                    VALUES (?, ?, ?, ?, ?)
                `, room);
            }
            console.log('✅ Salas de exemplo criadas!');
        } else {
            console.log('ℹ️ Salas já existem!');
        }

        console.log('\n🎉 Setup do Google Cloud SQL concluído com sucesso!');
        console.log('\n📊 Resumo das tabelas criadas:');
        console.log('   👥 users - Usuários do sistema');
        console.log('   🏢 rooms - Salas disponíveis');
        console.log('   📅 bookings - Reservas/agendamentos');
        
        console.log('\n🔐 Informações de login:');
        console.log('   👤 Email: admin@salalivre.com');
        console.log('   🔐 Senha: admin123');
        console.log('   🌐 URL: http://localhost:3000');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Erro no setup:', error.message);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

setupGoogleCloudDatabase();
