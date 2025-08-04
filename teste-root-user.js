// ==================== TESTE COM ROOT USER ====================

const mysql = require('mysql2/promise');

// Configurações com usuário root
const dbConfigRoot = {
    host: '35.184.206.243',
    user: 'root', 
    password: 'SalaLivre2024!',
    database: 'reuni-dep',
    port: 3306,
    connectTimeout: 60000
};

async function testarComRoot() {
    console.log('🔗 === TESTE COM USUÁRIO ROOT ===\n');
    
    try {
        console.log('📡 Conectando como root...');
        const connection = await mysql.createConnection(dbConfigRoot);
        
        console.log('✅ Conexão estabelecida como root!');
        
        // 1. Verificar usuários existentes
        console.log('\n1. 👥 Verificando usuários do banco...');
        const [users] = await connection.execute("SELECT user, host FROM mysql.user WHERE user IN ('root', 'app_user')");
        console.log('Usuários encontrados:', users);
        
        // 2. Criar/atualizar usuário app_user se necessário
        console.log('\n2. 🔧 Configurando usuário app_user...');
        
        try {
            // Tentar criar usuário
            await connection.execute("CREATE USER 'app_user'@'%' IDENTIFIED BY 'SalaLivre2024!'");
            console.log('✅ Usuário app_user criado');
        } catch (error) {
            if (error.code === 'ER_CANNOT_USER') {
                // Usuário já existe, atualizar senha
                await connection.execute("ALTER USER 'app_user'@'%' IDENTIFIED BY 'SalaLivre2024!'");
                console.log('✅ Senha do app_user atualizada');
            } else {
                console.log('⚠️ Erro ao criar usuário:', error.message);
            }
        }
        
        // 3. Dar permissões
        console.log('\n3. 🔑 Configurando permissões...');
        await connection.execute("GRANT ALL PRIVILEGES ON reuni-dep.* TO 'app_user'@'%'");
        await connection.execute("FLUSH PRIVILEGES");
        console.log('✅ Permissões configuradas');
        
        // 4. Verificar tabelas
        console.log('\n4. 📋 Verificando tabelas...');
        const [tables] = await connection.execute("SHOW TABLES");
        console.log('📊 Tabelas encontradas:');
        tables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });
        
        // 5. Verificar estrutura da tabela bookings se existir
        const bookingsTable = tables.find(t => Object.values(t)[0] === 'bookings');
        if (bookingsTable) {
            console.log('\n5. 🏗️ Estrutura da tabela bookings:');
            const [structure] = await connection.execute("DESCRIBE bookings");
            
            structure.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
            });
        } else {
            console.log('\n❌ Tabela bookings não encontrada. Será necessário criá-la.');
        }
        
        await connection.end();
        console.log('\n🎉 Configuração concluída!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔑 Problema de autenticação com root:');
            console.log('- Verificar se a senha do root está correta');
            console.log('- Verificar se o IP está autorizado no Google Cloud');
        }
    }
}

// Executar teste
testarComRoot();
