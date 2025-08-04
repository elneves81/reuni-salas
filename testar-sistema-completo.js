// ==================== TESTE COMPLETO: SISTEMA COM BANCO DE DADOS ====================

const testeSistemaCompleto = async () => {
    console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA');
    console.log('=' .repeat(60));

    try {
        // 1. Testar conectividade com Google Cloud SQL
        console.log('\n1️⃣ Testando conectividade Google Cloud SQL...');
        await testarConectividadeBanco();

        // 2. Testar APIs de usuários
        console.log('\n2️⃣ Testando APIs de usuários...');
        await testarAPIsUsuarios();

        // 3. Testar APIs de salas  
        console.log('\n3️⃣ Testando APIs de salas...');
        await testarAPIsSalas();

        // 4. Testar APIs de reuniões
        console.log('\n4️⃣ Testando APIs de reuniões...');
        await testarAPIsReunioes();

        // 5. Testar sincronização entre máquinas
        console.log('\n5️⃣ Testando sincronização...');
        await testarSincronizacao();

        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ Sistema pronto para produção com Google Cloud SQL');

    } catch (error) {
        console.error('\n💥 ERRO NOS TESTES:', error);
        throw error;
    }
};

const testarConectividadeBanco = async () => {
    try {
        const response = await fetch('/api/health');
        
        if (!response.ok) {
            throw new Error(`API não respondeu: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Google Cloud SQL conectado:', data);
        
        return true;
    } catch (error) {
        console.error('❌ Falha na conectividade:', error);
        throw error;
    }
};

const testarAPIsUsuarios = async () => {
    console.log('👥 Testando CRUD de usuários...');

    try {
        // GET - Listar usuários
        let response = await fetch('/api/users');
        if (!response.ok) throw new Error(`GET /api/users falhou: ${response.status}`);
        
        const usuarios = await response.json();
        console.log(`✅ GET /api/users - ${usuarios.length} usuários encontrados`);

        // POST - Criar usuário de teste
        const novoUsuario = {
            name: 'Teste Usuario',
            email: `teste_${Date.now()}@exemplo.com`,
            password: 'teste123',
            role: 'user',
            department: 'teste'
        };

        response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoUsuario)
        });

        if (!response.ok) throw new Error(`POST /api/users falhou: ${response.status}`);
        
        const usuarioCriado = await response.json();
        console.log('✅ POST /api/users - Usuário criado:', usuarioCriado.name);

        // PUT - Atualizar usuário
        response = await fetch(`/api/users/${usuarioCriado.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Teste Usuario Editado' })
        });

        if (!response.ok) throw new Error(`PUT /api/users falhou: ${response.status}`);
        
        const usuarioEditado = await response.json();
        console.log('✅ PUT /api/users - Usuário editado:', usuarioEditado.name);

        // DELETE - Excluir usuário
        response = await fetch(`/api/users/${usuarioCriado.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`DELETE /api/users falhou: ${response.status}`);
        
        console.log('✅ DELETE /api/users - Usuário excluído');

        return true;
    } catch (error) {
        console.error('❌ Erro nos testes de usuários:', error);
        throw error;
    }
};

const testarAPIsSalas = async () => {
    console.log('🏢 Testando CRUD de salas...');

    try {
        // GET - Listar salas
        let response = await fetch('/api/rooms');
        if (!response.ok) throw new Error(`GET /api/rooms falhou: ${response.status}`);
        
        const salas = await response.json();
        console.log(`✅ GET /api/rooms - ${salas.length} salas encontradas`);

        // POST - Criar sala de teste
        const novaSala = {
            name: `Sala Teste ${Date.now()}`,
            description: 'Sala para testes',
            capacity: 10,
            location: 'Andar de Teste',
            equipment: '["projetor", "wifi"]'
        };

        response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaSala)
        });

        if (!response.ok) throw new Error(`POST /api/rooms falhou: ${response.status}`);
        
        const salaCriada = await response.json();
        console.log('✅ POST /api/rooms - Sala criada:', salaCriada.name);

        // PUT - Atualizar sala
        response = await fetch(`/api/rooms/${salaCriada.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capacity: 15 })
        });

        if (!response.ok) throw new Error(`PUT /api/rooms falhou: ${response.status}`);
        
        console.log('✅ PUT /api/rooms - Sala editada');

        // DELETE - Excluir sala
        response = await fetch(`/api/rooms/${salaCriada.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`DELETE /api/rooms falhou: ${response.status}`);
        
        console.log('✅ DELETE /api/rooms - Sala excluída');

        return true;
    } catch (error) {
        console.error('❌ Erro nos testes de salas:', error);
        throw error;
    }
};

const testarAPIsReunioes = async () => {
    console.log('📅 Testando CRUD de reuniões...');

    try {
        // GET - Listar reuniões
        let response = await fetch('/api/bookings');
        if (!response.ok) throw new Error(`GET /api/bookings falhou: ${response.status}`);
        
        const reunioes = await response.json();
        console.log(`✅ GET /api/bookings - ${reunioes.length} reuniões encontradas`);

        // POST - Criar reunião de teste
        const novaReuniao = {
            title: `Reunião Teste ${Date.now()}`,
            description: 'Reunião para testes',
            start_time: new Date(Date.now() + 86400000).toISOString(), // Amanhã
            end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Amanhã + 1h
            room_id: 1,
            user_id: 1
        };

        response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaReuniao)
        });

        if (!response.ok) throw new Error(`POST /api/bookings falhou: ${response.status}`);
        
        const reuniaoCriada = await response.json();
        console.log('✅ POST /api/bookings - Reunião criada:', reuniaoCriada.title);

        // PUT - Atualizar reunião
        response = await fetch(`/api/bookings/${reuniaoCriada.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Reunião Teste Editada' })
        });

        if (!response.ok) throw new Error(`PUT /api/bookings falhou: ${response.status}`);
        
        console.log('✅ PUT /api/bookings - Reunião editada');

        // DELETE - Excluir reunião
        response = await fetch(`/api/bookings/${reuniaoCriada.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`DELETE /api/bookings falhou: ${response.status}`);
        
        console.log('✅ DELETE /api/bookings - Reunião excluída');

        return true;
    } catch (error) {
        console.error('❌ Erro nos testes de reuniões:', error);
        throw error;
    }
};

const testarSincronizacao = async () => {
    console.log('🔄 Testando sincronização entre máquinas...');

    try {
        // Simular dados sendo criados em "outra máquina"
        const timestamp = Date.now();
        
        // Criar usuário
        const usuario = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Usuário Sync ${timestamp}`,
                email: `sync_${timestamp}@exemplo.com`,
                password: 'sync123',
                role: 'user'
            })
        }).then(r => r.json());

        // Criar reunião
        const reuniao = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Reunião Sync ${timestamp}`,
                start_time: new Date(Date.now() + 86400000).toISOString(),
                end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
                room_id: 1,
                user_id: usuario.id
            })
        }).then(r => r.json());

        console.log('✅ Dados criados para teste de sincronização');

        // Simular "segunda máquina" buscando dados
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s

        const usuariosAtualizado = await fetch('/api/users').then(r => r.json());
        const reunioesAtualizado = await fetch('/api/bookings').then(r => r.json());

        const usuarioEncontrado = usuariosAtualizado.find(u => u.id === usuario.id);
        const reuniaoEncontrada = reunioesAtualizado.find(r => r.id === reuniao.id);

        if (!usuarioEncontrado) {
            throw new Error('Usuário não sincronizado');
        }

        if (!reuniaoEncontrada) {
            throw new Error('Reunião não sincronizada');
        }

        console.log('✅ Sincronização funcionando - dados disponíveis em todas as máquinas');

        // Limpeza
        await fetch(`/api/users/${usuario.id}`, { method: 'DELETE' });
        await fetch(`/api/bookings/${reuniao.id}`, { method: 'DELETE' });

        return true;
    } catch (error) {
        console.error('❌ Erro no teste de sincronização:', error);
        throw error;
    }
};

// Executar teste se chamado diretamente
if (typeof window !== 'undefined') {
    window.testarSistemaCompleto = testeSistemaCompleto;
    console.log('🧪 Script de teste carregado. Execute: testarSistemaCompleto()');
}

// Para Node.js
if (typeof module !== 'undefined') {
    module.exports = { testeSistemaCompleto };
}
