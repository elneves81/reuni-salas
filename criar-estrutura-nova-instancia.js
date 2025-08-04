// ==================== CRIAR ESTRUTURA COMPLETA NA NOVA INSTÂNCIA ====================

const mysql = require('mysql2/promise');

async function criarEstruturaNaNovaInstancia() {
    console.log('🏗️  CRIANDO ESTRUTURA COMPLETA NO BANCO reuni-dep');
    console.log('=' .repeat(60));
    
    const config = {
        host: '35.184.206.243',
        user: 'root',
        password: 'Neves2025@',
        database: 'reuni-dep',
        port: 3306,
        ssl: { rejectUnauthorized: false }
    };
    
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Conectado à nova instância!');
        
        // 1. Criar tabela users
        console.log('\n📋 Criando tabela users...');
        await connection.query(`CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user', 'manager') DEFAULT 'user',
            google_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
        console.log('✅ Tabela users criada');
        
        // 2. Criar tabela rooms
        console.log('\n🏢 Criando tabela rooms...');
        await connection.query(`CREATE TABLE IF NOT EXISTS rooms (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            capacity INT NOT NULL DEFAULT 10,
            equipment TEXT,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
        console.log('✅ Tabela rooms criada');
        
        // 3. Criar tabela bookings
        console.log('\n📅 Criando tabela bookings...');
        await connection.query(`CREATE TABLE IF NOT EXISTS bookings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            room_id INT NOT NULL,
            user_id INT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
            organizer VARCHAR(255),
            organizer_name VARCHAR(255),
            participants TEXT,
            equipment TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
        console.log('✅ Tabela bookings criada');
        
        // 4. Criar índices
        console.log('\n📊 Criando índices para performance...');
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, start_time, end_time)',
            'CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)'
        ];
        
        for (const indice of indices) {
            try {
                await connection.query(indice);
                console.log('   ✅ Índice criado');
            } catch (error) {
                console.log('   ⚠️  Índice já existe');
            }
        }
        
        // 5. Inserir dados iniciais
        console.log('\n📦 Inserindo dados iniciais...');
        
        // Verificar se já existem salas
        const [rooms] = await connection.query('SELECT COUNT(*) as total FROM rooms');
        if (rooms[0].total === 0) {
            await connection.query(`INSERT INTO rooms (name, capacity, equipment, description) VALUES
                ('Sala Alpha', 8, 'Projetor, TV 55", Quadro branco', 'Sala ideal para reuniões executivas'),
                ('Sala Beta', 12, 'Projetor, Sistema de áudio, Videoconferência', 'Sala para apresentações e treinamentos'),
                ('Sala Gamma', 6, 'TV 42", Quadro branco', 'Sala para reuniões pequenas'),
                ('Sala Delta', 15, 'Projetor, Sistema de som, Microfone', 'Auditório para eventos maiores'),
                ('Sala Omega', 4, 'TV 32", Mesa redonda', 'Sala para reuniões íntimas')`);
            console.log('✅ 5 salas inseridas');
        } else {
            console.log('⚠️  Salas já existem, pulando inserção');
        }
        
        // Verificar se já existe usuário admin
        const [users] = await connection.query('SELECT COUNT(*) as total FROM users WHERE role = "admin"');
        if (users[0].total === 0) {
            // Hash da senha "admin123"
            const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
            await connection.query(`INSERT INTO users (name, email, password, role) VALUES
                ('Administrador', 'admin@reunipro.com', '${hashedPassword}', 'admin')`);
            console.log('✅ Usuário admin criado');
            console.log('   📧 Email: admin@reunipro.com');
            console.log('   🔑 Senha: password');
        } else {
            console.log('⚠️  Usuário admin já existe');
        }
        
        // 6. Verificação final
        console.log('\n🔍 Verificação final da estrutura...');
        const [finalRooms] = await connection.query('SELECT COUNT(*) as total FROM rooms');
        const [finalUsers] = await connection.query('SELECT COUNT(*) as total FROM users');
        const [finalBookings] = await connection.query('SELECT COUNT(*) as total FROM bookings');
        
        console.log(`   📊 Salas: ${finalRooms[0].total}`);
        console.log(`   👥 Usuários: ${finalUsers[0].total}`);
        console.log(`   📅 Reuniões: ${finalBookings[0].total}`);
        
        await connection.end();
        
        console.log('\n🎉 ESTRUTURA CRIADA COM SUCESSO NA NOVA INSTÂNCIA!');
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Testar sistema completo: node testar-sistema-completo.js');
        console.log('2. Atualizar variáveis Netlify com nova configuração');
        console.log('3. Fazer deploy da nova versão');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ ERRO AO CRIAR ESTRUTURA:', error.message);
        console.log('\n🛠️  VERIFICAR:');
        console.log('- Conexão com banco');
        console.log('- Permissões do usuário root');
        console.log('- Configurações de rede');
        return false;
    }
}

// Executar
criarEstruturaNaNovaInstancia().catch(console.error);
