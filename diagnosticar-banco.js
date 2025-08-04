// ==================== DIAGNÓSTICO E CORREÇÃO DO BANCO ====================

const mysql = require('mysql2/promise');

class DiagnosticoBanco {
    constructor() {
        this.configsTentativas = [
            // Configuração 1: Nova instância principal
            {
                nome: 'Nova Instância reuni-dep',
                host: '35.184.206.243',
                user: 'root',
                password: 'Neves2025@',
                database: 'reuni-dep',
                port: 3306
            },
            // Configuração 2: Instância antiga (fallback)
            {
                nome: 'Instância Antiga',
                host: '35.184.206.243',
                user: 'root',
                password: 'Neves2025@',
                database: 'reuni-dep',
                port: 3306
            },
            // Configuração 3: Nova instância sem banco específico
            {
                nome: 'Nova Instância Simples',
                host: '35.184.206.243',
                user: 'root',
                password: 'Neves2025@',
                port: 3306
            }
        ];
    }

    async executarDiagnostico() {
        console.log('🔧 === DIAGNÓSTICO DO BANCO DE DADOS ===\n');

        for (const config of this.configsTentativas) {
            console.log(`🧪 Testando: ${config.nome}`);
            console.log(`   Host: ${config.host}`);
            console.log(`   User: ${config.user}`);
            console.log(`   Database: ${config.database || 'nenhum'}`);
            
            try {
                const conexao = await mysql.createConnection({
                    host: config.host,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    port: config.port,
                    connectTimeout: 10000
                });

                console.log('✅ CONEXÃO ESTABELECIDA!\n');

                // Testar comandos básicos
                await this.testarComandosBasicos(conexao, config);
                
                await conexao.end();
                
                // Se chegou até aqui, essa configuração funciona
                console.log(`🎉 CONFIGURAÇÃO FUNCIONANDO: ${config.nome}\n`);
                return config;

            } catch (error) {
                console.log(`❌ Falhou: ${error.message}\n`);
                continue;
            }
        }

        console.log('💥 NENHUMA CONFIGURAÇÃO FUNCIONOU!');
        throw new Error('Não foi possível conectar ao banco de dados');
    }

    async testarComandosBasicos(conexao, config) {
        try {
            // 1. Teste básico
            console.log('   🔍 Teste básico...');
            const [teste] = await conexao.execute('SELECT 1 as test');
            console.log('   ✅ SELECT funcionando');

            // 2. Listar bancos
            console.log('   🗄️ Listando bancos...');
            const [bancos] = await conexao.execute('SHOW DATABASES');
            console.log(`   📋 Bancos encontrados: ${bancos.map(b => b.Database).join(', ')}`);

            // 3. Se tiver banco específico, listar tabelas
            if (config.database) {
                console.log('   📊 Listando tabelas...');
                const [tabelas] = await conexao.execute('SHOW TABLES');
                if (tabelas.length > 0) {
                    console.log(`   📋 Tabelas: ${tabelas.map(t => Object.values(t)[0]).join(', ')}`);
                } else {
                    console.log('   ⚠️ Nenhuma tabela encontrada');
                }
            }

        } catch (error) {
            console.log(`   ❌ Erro nos testes: ${error.message}`);
            throw error;
        }
    }

    async criarEstruturaBanco(config) {
        console.log('🏗️ === CRIANDO ESTRUTURA DO BANCO ===\n');

        try {
            const conexao = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
                port: config.port
            });

            // 1. Criar banco se não existir
            console.log('📦 Criando banco reuni-dep...');
            await conexao.execute('CREATE DATABASE IF NOT EXISTS reuni-dep');
            console.log('✅ Banco criado/verificado');

            // 2. Usar o banco
            await conexao.execute('USE reuni-dep');

            // 3. Criar tabelas
            await this.criarTabelas(conexao);

            // 4. Inserir dados iniciais
            await this.inserirDadosIniciais(conexao);

            await conexao.end();
            console.log('🎉 ESTRUTURA DO BANCO CRIADA COM SUCESSO!\n');

        } catch (error) {
            console.error('❌ Erro ao criar estrutura:', error);
            throw error;
        }
    }

    async criarTabelas(conexao) {
        const tabelas = [
            // Tabela de usuários
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                department VARCHAR(255),
                status ENUM('active', 'inactive') DEFAULT 'active',
                google_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Tabela de salas
            `CREATE TABLE IF NOT EXISTS rooms (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                capacity INT DEFAULT 10,
                location VARCHAR(255),
                equipment JSON,
                status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Tabela de reservas
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                room_id INT NOT NULL,
                user_id INT NOT NULL,
                organizer_name VARCHAR(255),
                participants TEXT,
                status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
                equipment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        ];

        for (const sql of tabelas) {
            await conexao.execute(sql);
            console.log('✅ Tabela criada');
        }
    }

    async inserirDadosIniciais(conexao) {
        console.log('🌱 Inserindo dados iniciais...');

        // Verificar se já existem dados
        const [usuarios] = await conexao.execute('SELECT COUNT(*) as count FROM users');
        if (usuarios[0].count > 0) {
            console.log('⚠️ Dados já existem, pulando inserção');
            return;
        }

        // Inserir usuário admin
        await conexao.execute(`
            INSERT INTO users (name, email, password, role, department) 
            VALUES ('Admin Sistema', 'admin@salalivre.com', '$2b$10$hash_aqui', 'admin', 'TI')
        `);

        // Inserir salas exemplo
        const salas = [
            ['Sala Alpha', 'Sala de reuniões principal', 12, 'Andar 1'],
            ['Sala Beta', 'Sala de treinamentos', 20, 'Andar 2'],
            ['Sala Gamma', 'Sala executiva', 6, 'Andar 3']
        ];

        for (const sala of salas) {
            await conexao.execute(`
                INSERT INTO rooms (name, description, capacity, location) 
                VALUES (?, ?, ?, ?)
            `, sala);
        }

        console.log('✅ Dados iniciais inseridos');
    }

    async atualizarDbUtils(configFuncionando) {
        console.log('📝 Atualizando arquivo db-utils.js...');

        const novoConteudo = `// ==================== CONEXÃO GOOGLE CLOUD SQL PARA NETLIFY ====================

const mysql = require('mysql2/promise');

// Configuração do banco (TESTADA E FUNCIONANDO)
const dbConfig = {
    host: '${configFuncionando.host}',
    user: '${configFuncionando.user}',
    password: '${configFuncionando.password}',
    database: '${configFuncionando.database || 'reuni-dep'}',
    port: ${configFuncionando.port},
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Pool de conexões
let pool = null;

function createPool() {
    if (!pool) {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('✅ Pool MySQL criado para Google Cloud SQL');
    }
    return pool;
}

// Função para executar queries
async function executeQuery(query, params = []) {
    try {
        const connection = createPool();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw new Error(\`Erro no banco: \${error.message}\`);
    }
}

// Função para testar conexão
async function testConnection() {
    try {
        const result = await executeQuery('SELECT 1 as test');
        console.log('✅ Conexão com banco funcionando');
        return { success: true, result };
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    executeQuery,
    testConnection,
    createPool
};`;

        // Escrever arquivo atualizado
        const fs = require('fs').promises;
        const path = require('path');
        
        const caminhoArquivo = path.join(__dirname, 'netlify', 'functions', 'db-utils.js');
        await fs.writeFile(caminhoArquivo, novoConteudo);
        
        console.log('✅ Arquivo db-utils.js atualizado com configurações funcionais');
    }
}

// Executar diagnóstico
async function executarDiagnostico() {
    const diagnostico = new DiagnosticoBanco();
    
    try {
        console.log('🚀 Iniciando diagnóstico do banco...\n');
        
        const configFuncionando = await diagnostico.executarDiagnostico();
        
        console.log('🏗️ Criando estrutura do banco...\n');
        await diagnostico.criarEstruturaBanco(configFuncionando);
        
        console.log('📝 Atualizando configurações...\n');
        await diagnostico.atualizarDbUtils(configFuncionando);
        
        console.log('🎉 === BANCO CONFIGURADO COM SUCESSO ===');
        console.log('✅ Conexão testada e funcionando');
        console.log('✅ Estrutura de tabelas criada');
        console.log('✅ Dados iniciais inseridos');
        console.log('✅ Arquivo db-utils.js atualizado');
        console.log('\n🚀 Sistema pronto para usar!');
        
    } catch (error) {
        console.error('💥 ERRO NO DIAGNÓSTICO:', error.message);
        console.log('\n🆘 POSSÍVEIS SOLUÇÕES:');
        console.log('1. Verificar se o IP 35.184.206.243 está correto');
        console.log('2. Verificar se a senha está correta');
        console.log('3. Verificar firewall do Google Cloud');
        console.log('4. Verificar se a instância está rodando');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarDiagnostico();
}

module.exports = DiagnosticoBanco;
