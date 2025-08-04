// ==================== VERIFICAR ESTRUTURA DA TABELA BOOKINGS ====================

const { executeQuery } = require('./netlify/functions/db-utils');

async function verificarEstrutura() {
    console.log('🔍 === VERIFICANDO ESTRUTURA DA TABELA BOOKINGS ===\n');
    
    try {
        // 1. Verificar se a tabela existe
        console.log('1. 📋 Verificando se tabela bookings existe...');
        const tables = await executeQuery("SHOW TABLES LIKE 'bookings'");
        
        if (tables.length === 0) {
            console.log('❌ Tabela bookings não existe!');
            return;
        }
        
        console.log('✅ Tabela bookings encontrada');
        
        // 2. Verificar estrutura da tabela
        console.log('\n2. 🏗️ Estrutura da tabela bookings:');
        const structure = await executeQuery("DESCRIBE bookings");
        
        structure.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });
        
        // 3. Verificar dados existentes
        console.log('\n3. 📊 Verificando dados existentes...');
        const count = await executeQuery("SELECT COUNT(*) as total FROM bookings");
        console.log(`Total de registros: ${count[0].total}`);
        
        if (count[0].total > 0) {
            console.log('\n📝 Primeiros 3 registros:');
            const sample = await executeQuery("SELECT * FROM bookings LIMIT 3");
            sample.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Título: ${row.title || row.subject || 'N/A'}`);
            });
        }
        
        // 4. Verificar se existe coluna start_time
        const hasStartTime = structure.find(col => col.Field === 'start_time');
        const hasSubject = structure.find(col => col.Field === 'subject');
        
        console.log('\n4. 🕐 Verificando colunas de tempo:');
        console.log(`- start_time: ${hasStartTime ? '✅' : '❌'}`);
        console.log(`- subject: ${hasSubject ? '✅' : '❌'}`);
        
        if (!hasStartTime && hasSubject) {
            console.log('\n🔧 DIAGNÓSTICO: A tabela usa "subject" em vez de "title" e pode não ter "start_time"');
            console.log('Será necessário ajustar a consulta SQL');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    }
}

// Executar verificação
verificarEstrutura();
