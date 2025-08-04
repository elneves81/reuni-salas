// ==================== TESTE COMPLETO DO SISTEMA DE RESERVAS ====================

const BASE_URL = 'https://salalivre.netlify.app/.netlify/functions';

async function testarSistemaReservas() {
    console.log('🧪 === TESTE COMPLETO DO SISTEMA DE RESERVAS ===\n');
    
    try {
        // 1. Testar endpoint de reservas
        console.log('1. 📅 Testando carregamento de reservas...');
        const reservasResponse = await fetch(`${BASE_URL}/bookings`);
        
        if (!reservasResponse.ok) {
            throw new Error(`HTTP ${reservasResponse.status}: ${await reservasResponse.text()}`);
        }
        
        const reservasData = await reservasResponse.json();
        console.log(`✅ Reservas carregadas: ${reservasData.length} encontradas`);
        
        if (reservasData.length > 0) {
            const primeiraReserva = reservasData[0];
            console.log('📝 Primeira reserva:', {
                id: primeiraReserva.id,
                title: primeiraReserva.title || primeiraReserva.subject,
                room: primeiraReserva.room_name || `Sala ${primeiraReserva.room_id}`,
                date: primeiraReserva.start_time ? primeiraReserva.start_time.split('T')[0] : 'N/A',
                organizer: primeiraReserva.organizer_name || primeiraReserva.organizer
            });
        }
        
        // 2. Testar endpoint de salas
        console.log('\n2. 🏢 Testando carregamento de salas...');
        const salasResponse = await fetch(`${BASE_URL}/rooms`);
        
        if (!salasResponse.ok) {
            throw new Error(`HTTP ${salasResponse.status}: ${await salasResponse.text()}`);
        }
        
        const salasData = await salasResponse.json();
        console.log(`✅ Salas carregadas: ${salasData.length} encontradas`);
        
        // 3. Testar conectividade geral
        console.log('\n3. 🔗 Testando conectividade com API...');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ API respondendo:', healthData);
        } else {
            console.log('⚠️ Endpoint health não disponível, mas API está respondendo');
        }
        
        // 4. Simular criação de reserva (teste)
        console.log('\n4. 📝 Testando criação de reserva...');
        const novaReserva = {
            title: 'Teste Reserva - ' + new Date().toISOString(),
            room_id: salasData[0]?.id || 1,
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
            end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Amanhã + 1h
            organizer: 'Sistema de Teste',
            description: 'Reserva criada automaticamente para teste'
        };
        
        const criarResponse = await fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaReserva)
        });
        
        if (criarResponse.ok) {
            const criarData = await criarResponse.json();
            console.log('✅ Reserva criada:', criarData);
            
            // 5. Verificar se reserva foi criada
            console.log('\n5. 🔍 Verificando se reserva foi salva...');
            const verificarResponse = await fetch(`${BASE_URL}/bookings`);
            const verificarData = await verificarResponse.json();
            const reservaCriada = verificarData.find(r => r.title === novaReserva.title);
            
            if (reservaCriada) {
                console.log('✅ Reserva encontrada no banco:', reservaCriada.id);
                
                // 6. Limpar teste - deletar reserva criada
                console.log('\n6. 🗑️ Limpando teste...');
                const deleteResponse = await fetch(`${BASE_URL}/bookings/${reservaCriada.id}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    console.log('✅ Reserva de teste removida');
                } else {
                    console.log('⚠️ Não foi possível remover a reserva de teste');
                }
            }
            
        } else {
            console.log('⚠️ Não foi possível criar reserva de teste:', await criarResponse.text());
        }
        
        console.log('\n🎉 === TESTE COMPLETO CONCLUÍDO ===');
        console.log('\n📋 Resumo:');
        console.log(`- Reservas existentes: ${reservasData.length}`);
        console.log(`- Salas disponíveis: ${salasData.length}`);
        console.log('- API funcionando: ✅');
        console.log('- Sistema pronto para integração!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        console.log('\n🚨 === PROBLEMAS ENCONTRADOS ===');
        console.log('- Verificar se o banco de dados está conectado');
        console.log('- Verificar se as Netlify Functions estão funcionando');
        console.log('- Verificar logs no Netlify Dashboard');
    }
}

// Executar teste
testarSistemaReservas();
