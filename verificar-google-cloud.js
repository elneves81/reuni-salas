// ==================== VERIFICAÇÃO DE ACESSO AO GOOGLE CLOUD SQL ====================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class GoogleCloudSQLTester {
    constructor() {
        this.loadEnvironment();
        this.connectionConfig = this.getConnectionConfig();
    }

    loadEnvironment() {
        // Tentar carregar .env se existir
        try {
            require('dotenv').config();
            console.log('📄 Arquivo .env carregado');
        } catch (err) {
            console.log('ℹ️ Arquivo .env não encontrado, usando variáveis de ambiente ou padrões');
        }
    }

    getConnectionConfig() {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sala_livre',
            connectTimeout: 15000,
            acquireTimeout: 15000,
            timeout: 15000,
            retry: true
        };
    }

    async checkEnvironmentVariables() {
        console.log('🔍 === VERIFICANDO CONFIGURAÇÕES ===');
        console.log(`📍 Host: ${this.connectionConfig.host}`);
        console.log(`👤 User: ${this.connectionConfig.user}`);
        console.log(`🗄️ Database: ${this.connectionConfig.database}`);
        console.log(`🔌 Port: ${this.connectionConfig.port}`);
        console.log(`🔑 Password: ${this.connectionConfig.password ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
        
        // Verificar se parece configuração do Google Cloud
        const isGoogleCloud = this.connectionConfig.host.includes('gcp') || 
                             this.connectionConfig.host.includes('google') ||
                             this.connectionConfig.host.includes('cloudsql') ||
                             this.connectionConfig.host.match(/^\d+\.\d+\.\d+\.\d+$/);
        
        console.log(`☁️ Tipo de conexão: ${isGoogleCloud ? 'Google Cloud SQL' : 'Local/Outro'}`);
        return isGoogleCloud;
    }

    async testBasicConnection() {
        console.log('\n🔄 === TESTANDO CONEXÃO BÁSICA ===');
        
        try {
            const connection = await mysql.createConnection(this.connectionConfig);
            console.log('✅ Conexão estabelecida com sucesso!');
            
            // Teste básico
            const [result] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
            console.log('✅ Teste SQL básico passou:', result[0]);
            
            await connection.end();
            return true;
            
        } catch (error) {
            console.error('❌ Erro na conexão:', error.message);
            
            if (error.code === 'ENOTFOUND') {
                console.error('🔧 Solução: Verifique o endereço do host');
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('🔧 Solução: Verifique usuário e senha');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('🔧 Solução: Verifique se a instância está ativa');
            }
            
            return false;
        }
    }

    async checkDatabaseStructure() {
        console.log('\n🗄️ === VERIFICANDO ESTRUTURA DO BANCO ===');
        
        try {
            const connection = await mysql.createConnection(this.connectionConfig);
            
            // Verificar se banco existe
            const [databases] = await connection.execute('SHOW DATABASES');
            const dbExists = databases.some(db => db.Database === this.connectionConfig.database);
            
            if (!dbExists) {
                console.log(`❌ Banco '${this.connectionConfig.database}' não existe`);
                console.log('📋 Bancos disponíveis:');
                databases.forEach(db => console.log(`   - ${db.Database}`));
                await connection.end();
                return false;
            }
            
            console.log(`✅ Banco '${this.connectionConfig.database}' encontrado`);
            
            // Verificar tabelas
            const [tables] = await connection.execute('SHOW TABLES');
            console.log(`📊 Tabelas encontradas: ${tables.length}`);
            
            const requiredTables = ['users', 'rooms', 'bookings'];
            const existingTables = tables.map(t => Object.values(t)[0]);
            
            requiredTables.forEach(table => {
                if (existingTables.includes(table)) {
                    console.log(`   ✅ ${table}`);
                } else {
                    console.log(`   ❌ ${table} (faltando)`);
                }
            });
            
            await connection.end();
            return existingTables.length > 0;
            
        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
            return false;
        }
    }

    async testCRUDOperations() {
        console.log('\n🧪 === TESTANDO OPERAÇÕES CRUD ===');
        
        try {
            const connection = await mysql.createConnection(this.connectionConfig);
            
            // Verificar se tabela users existe
            const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
            if (tables.length === 0) {
                console.log('⚠️ Tabela users não existe, pulando teste CRUD');
                await connection.end();
                return false;
            }
            
            // Teste de READ
            const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
            console.log(`✅ READ: ${users[0].count} usuários encontrados`);
            
            // Teste de INSERT (usuário temporário)
            const testEmail = `test_${Date.now()}@teste.com`;
            await connection.execute(
                'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
                ['Teste Usuário', testEmail, 'user']
            );
            console.log('✅ INSERT: Usuário teste criado');
            
            // Teste de UPDATE
            await connection.execute(
                'UPDATE users SET name = ? WHERE email = ?',
                ['Teste Atualizado', testEmail]
            );
            console.log('✅ UPDATE: Usuário teste atualizado');
            
            // Teste de DELETE
            await connection.execute('DELETE FROM users WHERE email = ?', [testEmail]);
            console.log('✅ DELETE: Usuário teste removido');
            
            await connection.end();
            return true;
            
        } catch (error) {
            console.error('❌ Erro no teste CRUD:', error.message);
            return false;
        }
    }

    async generateConnectionReport() {
        console.log('\n📊 === RELATÓRIO DE CONECTIVIDADE ===');
        
        const results = {
            environment: await this.checkEnvironmentVariables(),
            connection: await this.testBasicConnection(),
            structure: false,
            crud: false
        };
        
        if (results.connection) {
            results.structure = await this.checkDatabaseStructure();
            if (results.structure) {
                results.crud = await this.testCRUDOperations();
            }
        }
        
        console.log('\n🎯 === RESUMO FINAL ===');
        console.log(`☁️ Google Cloud SQL: ${results.environment ? '✅ Detectado' : '❌ Local/Outro'}`);
        console.log(`🔗 Conexão: ${results.connection ? '✅ OK' : '❌ Falha'}`);
        console.log(`🗄️ Estrutura: ${results.structure ? '✅ OK' : '❌ Incompleta'}`);
        console.log(`🧪 CRUD: ${results.crud ? '✅ OK' : '❌ Falha'}`);
        
        const score = Object.values(results).filter(Boolean).length;
        console.log(`\n⭐ Score: ${score}/4`);
        
        if (score === 4) {
            console.log('🎉 Sistema totalmente funcional com Google Cloud SQL!');
        } else if (score >= 2) {
            console.log('⚠️ Sistema parcialmente funcional, verifique itens em falha');
        } else {
            console.log('❌ Sistema não funcional, verifique configurações');
        }
        
        return results;
    }

    async createSetupInstructions() {
        console.log('\n📋 === INSTRUÇÕES DE CONFIGURAÇÃO ===');
        
        console.log('1. Criar arquivo .env na raiz do projeto:');
        console.log('   DB_HOST=SEU_IP_GOOGLE_CLOUD_SQL');
        console.log('   DB_USER=app_user');
        console.log('   DB_PASSWORD=SUA_SENHA');
        console.log('   DB_NAME=sala_livre');
        
        console.log('\n2. Configurar Google Cloud SQL:');
        console.log('   - Criar instância MySQL 8.0');
        console.log('   - Configurar redes autorizadas (0.0.0.0/0 para teste)');
        console.log('   - Criar banco de dados "sala_livre"');
        console.log('   - Criar usuário "app_user"');
        
        console.log('\n3. Executar setup do banco:');
        console.log('   node setup/database.js');
        
        console.log('\n4. Testar novamente:');
        console.log('   node verificar-google-cloud.js');
    }
}

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
    console.log('🚀 === VERIFICAÇÃO DE ACESSO AO GOOGLE CLOUD SQL ===\n');
    
    const tester = new GoogleCloudSQLTester();
    const results = await tester.generateConnectionReport();
    
    if (Object.values(results).every(Boolean)) {
        console.log('\n✨ Tudo configurado corretamente!');
    } else {
        await tester.createSetupInstructions();
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GoogleCloudSQLTester;
