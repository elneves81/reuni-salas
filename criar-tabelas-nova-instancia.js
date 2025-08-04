// ==================== CRIAR TABELAS NA NOVA INSTÂNCIA ====================

const mysql = require('mysql2/promise');

class CriarTabelasNovaInstancia {
    constructor(host, password = 'Neves2025@') {
        this.config = {
            host: host,
            user: 'root',
            password: password,
            database: 'reuni-dep',
            port: 3306,
            ssl: {
                rejectUnauthorized: false
            }
        };
    }

    async executar() {
        console.log('🏗️  CRIANDO ESTRUTURA DO BANCO NA NOVA INSTÂNCIA');
        console.log('=' .repeat(60));
        console.log(`🌐 Host: ${this.config.host}`);
        console.log(`📊 Database: ${this.config.database}`);

        try {
            const connection = await mysql.createConnection(this.config);
            console.log('✅ Conectado à nova instância!');

            // 1. Criar banco se não existir
            await this.criarBanco(connection);

        // 2. Usar o banco
        await connection.query('USE reuni-dep');            // 3. Criar tabelas
            await this.criarTabelas(connection);

            // 4. Inserir dados iniciais
            await this.inserirDadosIniciais(connection);

            await connection.end();
            console.log('\n🎉 ESTRUTURA CRIADA COM SUCESSO!');

        } catch (error) {
            console.error('❌ Erro:', error.message);
            throw error;
        }
    }

    async criarBanco(connection) {
        console.log('\n1. 🗄️  Criando banco de dados...');
        try {
            await connection.query('CREATE DATABASE IF NOT EXISTS reuni-dep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            console.log('✅ Banco "reuni-dep" criado/verificado');
        } catch (error) {
            console.log('⚠️  Banco já existe ou erro:', error.message);
        }
    }

    async criarTabelas(connection) {
        console.log('\n2. 📋 Criando tabelas...');

        const tabelas = [
            {
                nome: 'users',
                sql: `CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
                    google_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                nome: 'rooms',
                sql: `CREATE TABLE IF NOT EXISTS rooms (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    capacity INT NOT NULL DEFAULT 10,
                    equipment TEXT,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                nome: 'bookings',
                sql: `CREATE TABLE IF NOT EXISTS bookings (
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
                )`
            }
        ];

        for (const tabela of tabelas) {
            try {
                await connection.query(tabela.sql);
                console.log(`   ✅ Tabela "${tabela.nome}" criada`);
            } catch (error) {
                console.log(`   ❌ Erro na tabela "${tabela.nome}":`, error.message);
            }
        }

        // Criar índices
        console.log('\n   📊 Criando índices...');
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
                console.log(`   ✅ Índice criado`);
            } catch (error) {
                console.log(`   ⚠️  Índice já existe:`, error.message.substring(0, 50));
            }
        }
    }

    async inserirDadosIniciais(connection) {
        console.log('\n3. 📦 Inserindo dados iniciais...');

        // Verificar se já existem dados
        const [rooms] = await connection.query('SELECT COUNT(*) as total FROM rooms');
        if (rooms[0].total > 0) {
            console.log('   ⚠️  Dados já existem, pulando inserção');
            return;
        }

        // Inserir salas
        const salasSQL = `INSERT INTO rooms (name, capacity, equipment, description) VALUES
            ('Sala Alpha', 8, 'Projetor, TV 55", Quadro branco', 'Sala ideal para reuniões executivas'),
            ('Sala Beta', 12, 'Projetor, Sistema de áudio, Videoconferência', 'Sala para apresentações e treinamentos'),
            ('Sala Gamma', 6, 'TV 42", Quadro branco', 'Sala para reuniões pequenas'),
            ('Sala Delta', 15, 'Projetor, Sistema de som, Microfone', 'Auditório para eventos maiores'),
            ('Sala Omega', 4, 'TV 32", Mesa redonda', 'Sala para reuniões íntimas')`;

        try {
            await connection.query(salasSQL);
            console.log('   ✅ 5 salas inseridas');
        } catch (error) {
            console.log('   ❌ Erro ao inserir salas:', error.message);
        }

        // Inserir usuário admin
        const adminSQL = `INSERT INTO users (name, email, password, role) VALUES
            ('Administrador', 'admin@reunipro.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')`;

        try {
            await connection.query(adminSQL);
            console.log('   ✅ Usuário administrador criado');
            console.log('   📧 Email: admin@reunipro.com');
            console.log('   🔑 Senha: password');
        } catch (error) {
            console.log('   ❌ Erro ao inserir admin:', error.message);
        }
    }
}

// Script principal
async function main() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔧 CONFIGURADOR DE NOVA INSTÂNCIA GOOGLE CLOUD SQL');
    console.log('=' .repeat(60));

    readline.question('🌐 Digite o IP público da nova instância: ', async (ip) => {
        readline.close();

        try {
            const criador = new CriarTabelasNovaInstancia(ip.trim());
            await criador.executar();

            console.log('\n🚀 PRÓXIMOS PASSOS:');
            console.log('1. Execute: node atualizar-configuracoes-nova-instancia.js');
            console.log('2. Execute: node testar-nova-instancia.js');
            console.log('3. Se tudo funcionar, faça deploy no Netlify');

        } catch (error) {
            console.error('\n❌ FALHA NA CONFIGURAÇÃO:', error.message);
            console.log('\n🛠️  VERIFICAR:');
            console.log('- IP está autorizado no Google Cloud?');
            console.log('- Instância está rodando?');
            console.log('- Senha está correta?');
        }
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarTabelasNovaInstancia;
