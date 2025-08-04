// ==================== SETUP DO BANCO DE DADOS ====================
const mysql = require('mysql2/promise');
require('dotenv').config();

// ==================== CONFIGURAÇÕES ====================
const dbConfig = {
    host: process.env.DB_HOST || '35.184.206.243',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Neves2025@',
    multipleStatements: true
};

const databaseName = process.env.DB_NAME || 'reuni-dep';

// ==================== SQL PARA CRIAÇÃO DAS TABELAS ====================
const createDatabaseSQL = `CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

const createTablesSQL = `
-- ==================== TABELA DE USUÁRIOS ====================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NULL,
    google_id VARCHAR(100) NULL,
    avatar VARCHAR(500) NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    department VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    auth_provider ENUM('local', 'google') DEFAULT 'local',
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_google_id (google_id),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB;

-- ==================== TABELA DE DEPARTAMENTOS ====================
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    manager_id INT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB;

-- ==================== TABELA DE SALAS ====================
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    capacity INT NOT NULL DEFAULT 1,
    location VARCHAR(200) NULL,
    equipment JSON NULL,
    amenities JSON NULL,
    color VARCHAR(7) DEFAULT '#22c55e',
    image VARCHAR(500) NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_capacity (capacity),
    INDEX idx_active (active)
) ENGINE=InnoDB;

-- ==================== TABELA DE RESERVAS ====================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    recurring ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',
    recurring_until DATE NULL,
    attendees JSON NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_room_time (room_id, start_time, end_time)
) ENGINE=InnoDB;

-- ==================== TABELA DE PERMISSÕES DE SALA ====================
CREATE TABLE IF NOT EXISTS room_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NULL,
    department_id INT NULL,
    permission_type ENUM('view', 'book', 'manage') NOT NULL,
    granted_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_room_permission (room_id, user_id, permission_type),
    UNIQUE KEY unique_dept_room_permission (room_id, department_id, permission_type),
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB;

-- ==================== TABELA DE NOTIFICAÇÕES ====================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('booking_created', 'booking_updated', 'booking_cancelled', 'booking_reminder', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT NULL,
    related_type ENUM('booking', 'room', 'user') NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_read_at (read_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ==================== TABELA DE CONFIGURAÇÕES ====================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NULL,
    description TEXT NULL,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key_name (key_name),
    INDEX idx_category (category)
) ENGINE=InnoDB;

-- ==================== TABELA DE LOGS ====================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ==================== TABELA DE HIERARQUIA DE USUÁRIOS ====================
CREATE TABLE IF NOT EXISTS user_hierarchy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hierarchy (parent_id, child_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_child_id (child_id),
    INDEX idx_level (level)
) ENGINE=InnoDB;
`;

// ==================== DADOS INICIAIS ====================
const insertInitialDataSQL = `
-- ==================== USUÁRIO ADMINISTRADOR ====================
INSERT IGNORE INTO users (id, name, email, password, role, auth_provider, email_verified, active) VALUES 
(1, 'Administrador', 'admin@salalivre.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', 'admin', 'local', TRUE, TRUE);

-- ==================== DEPARTAMENTOS PADRÃO ====================
INSERT IGNORE INTO departments (id, name, description, manager_id) VALUES 
(1, 'Administração', 'Departamento de Administração Geral', 1),
(2, 'Recursos Humanos', 'Departamento de Recursos Humanos', 1),
(3, 'Tecnologia', 'Departamento de Tecnologia da Informação', 1),
(4, 'Vendas', 'Departamento de Vendas', 1),
(5, 'Marketing', 'Departamento de Marketing', 1);

-- ==================== SALAS PADRÃO ====================
INSERT IGNORE INTO rooms (id, name, description, capacity, location, equipment, color) VALUES 
(1, 'Sala Principal', 'Sala de reuniões principal com projetor e ar condicionado', 12, 'Andar 1', '["Projetor", "Ar condicionado", "TV 55\"", "Mesa para 12 pessoas"]', '#22c55e'),
(2, 'Sala Executiva', 'Sala para reuniões executivas', 6, 'Andar 2', '["TV 42\"", "Ar condicionado", "Mesa para 6 pessoas", "Quadro branco"]', '#3b82f6'),
(3, 'Sala de Videoconferência', 'Sala equipada para videoconferências', 8, 'Andar 1', '["Câmera HD", "Microfone", "TV 65\"", "Sistema de áudio", "Ar condicionado"]', '#8b5cf6'),
(4, 'Sala Pequena', 'Sala para reuniões menores', 4, 'Andar 1', '["TV 32\"", "Mesa para 4 pessoas"]', '#f59e0b'),
(5, 'Auditório', 'Auditório para grandes apresentações', 50, 'Térreo', '["Projetor", "Sistema de som", "Microfone sem fio", "Ar condicionado"]', '#ef4444');

-- ==================== CONFIGURAÇÕES PADRÃO ====================
INSERT IGNORE INTO settings (key_name, value, description, type, category) VALUES 
('app_name', 'Sala Livre', 'Nome da aplicação', 'string', 'general'),
('timezone', 'America/Sao_Paulo', 'Fuso horário padrão', 'string', 'general'),
('max_booking_duration', '480', 'Duração máxima de reserva em minutos', 'number', 'booking'),
('min_booking_duration', '30', 'Duração mínima de reserva em minutos', 'number', 'booking'),
('booking_advance_days', '30', 'Dias de antecedência para reservas', 'number', 'booking'),
('allow_overlapping', 'false', 'Permitir reservas sobrepostas', 'boolean', 'booking'),
('email_notifications', 'true', 'Enviar notificações por email', 'boolean', 'notifications'),
('working_hours_start', '08:00', 'Horário de início do expediente', 'string', 'general'),
('working_hours_end', '18:00', 'Horário de fim do expediente', 'string', 'general'),
('weekend_booking', 'false', 'Permitir reservas em fins de semana', 'boolean', 'booking');
`;

// ==================== FUNÇÃO PRINCIPAL ====================
async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔄 Iniciando configuração do banco de dados...\n');
        
        // Conectar ao MySQL sem especificar database
        console.log('📡 Conectando ao MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao MySQL com sucesso!\n');
        
        // Criar database
        console.log(`🏗️  Criando database '${databaseName}'...`);
        await connection.execute(createDatabaseSQL);
        console.log('✅ Database criado/verificado com sucesso!\n');
        
        // Selecionar database
        await connection.execute(`USE ${databaseName}`);
        console.log(`📂 Usando database '${databaseName}'\n`);
        
        // Criar tabelas
        console.log('🏗️  Criando tabelas...');
        await connection.execute(createTablesSQL);
        console.log('✅ Tabelas criadas com sucesso!\n');
        
        // Inserir dados iniciais
        console.log('📝 Inserindo dados iniciais...');
        await connection.execute(insertInitialDataSQL);
        console.log('✅ Dados iniciais inseridos com sucesso!\n');
        
        // Verificar estrutura
        console.log('🔍 Verificando estrutura do banco...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Tabelas criadas:');
        tables.forEach(table => {
            console.log(`   ✓ ${Object.values(table)[0]}`);
        });
        
        console.log('\n🎉 Configuração do banco de dados concluída com sucesso!');
        console.log('\n📊 Informações de acesso:');
        console.log(`   • Database: ${databaseName}`);
        console.log(`   • Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`   • Usuário Admin: admin@salalivre.com`);
        console.log(`   • Senha Admin: admin123 (altere após primeiro login)`);
        console.log('\n🚀 Agora você pode iniciar o servidor com: npm start');
        
    } catch (error) {
        console.error('❌ Erro na configuração do banco de dados:', error.message);
        console.error('\n💡 Dicas para resolver:');
        console.error('   1. Verifique se o MySQL está rodando');
        console.error('   2. Verifique as credenciais no arquivo .env');
        console.error('   3. Verifique se o usuário tem permissões para criar databases');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// ==================== FUNÇÃO PARA RESET DO BANCO ====================
async function resetDatabase() {
    let connection;
    
    try {
        console.log('⚠️  ATENÇÃO: Isso irá apagar todos os dados!\n');
        
        // Simular confirmação (em um ambiente real, usar readline)
        console.log('🔄 Resetando banco de dados...\n');
        
        connection = await mysql.createConnection(dbConfig);
        
        // Dropar database
        console.log(`🗑️  Removendo database '${databaseName}'...`);
        await connection.execute(`DROP DATABASE IF EXISTS ${databaseName}`);
        console.log('✅ Database removido com sucesso!\n');
        
        // Recriar tudo
        await setupDatabase();
        
    } catch (error) {
        console.error('❌ Erro ao resetar banco de dados:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// ==================== EXECUÇÃO ====================
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--reset')) {
        resetDatabase();
    } else {
        setupDatabase();
    }
}

module.exports = { setupDatabase, resetDatabase };
