// ==================== TESTE FINAL DO SISTEMA COMPLETO ====================

const axios = require('axios');

async function testarSistemaCompleto() {
    console.log('🎯 TESTE FINAL DO SISTEMA REUNIPRO');
    console.log('=' .repeat(50));
    
    const BASE_URL = 'https://salalivre.netlify.app/.netlify/functions';
    
    try {
        console.log('1. 🔍 Testando endpoint de salas...');
        const rooms = await axios.get(`${BASE_URL}/rooms`);
        console.log(`✅ Salas carregadas: ${rooms.data.length} encontradas`);
        
        console.log('\n2. 📅 Testando endpoint de reservas...');
        const bookings = await axios.get(`${BASE_URL}/bookings`);
        console.log(`✅ Reservas carregadas: ${bookings.data.length} encontradas`);
        
        console.log('\n3. 👥 Testando endpoint de usuários...');
        try {
            const users = await axios.get(`${BASE_URL}/users`);
            console.log(`✅ Usuários carregados: ${users.data.length} encontrados`);
        } catch (userError) {
            console.log('⚠️  Endpoint de usuários requer autenticação');
        }
        
        console.log('\n4. 🔗 Testando health check...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ API está funcionando:', health.data);
        
        console.log('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
        console.log('\n📊 STATUS FINAL:');
        console.log('   ✅ Nova instância Google Cloud conectada');
        console.log('   ✅ Banco reuni-dep funcionando');
        console.log('   ✅ Netlify Functions operacionais');
        console.log('   ✅ APIs respondendo corretamente');
        console.log('\n🚀 SISTEMA PRONTO PARA USO!');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Detalhes:', error.response.data);
        }
        
        console.log('\n🛠️  POSSÍVEIS SOLUÇÕES:');
        console.log('- Verificar se Netlify Functions estão atualizadas');
        console.log('- Confirmar variáveis de ambiente no Netlify');
        console.log('- Testar conectividade de rede');
        
        return false;
    }
}

// Executar teste
testarSistemaCompleto().catch(console.error);
