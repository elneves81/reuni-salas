// ==================== TESTE DE CONECTIVIDADE NETLIFY → BANCO ====================

const testarConectividadeNetlify = async () => {
    console.log('🌐 TESTANDO CONECTIVIDADE: https://salalivre.netlify.app/ → Google Cloud SQL');
    console.log('=' .repeat(70));

    try {
        // 1. Verificar configuração atual
        console.log('\n1️⃣ Verificando configuração...');
        await verificarConfiguracao();

        // 2. Testar API Client
        console.log('\n2️⃣ Testando API Client...');
        await testarAPIClient();

        // 3. Testar endpoints específicos
        console.log('\n3️⃣ Testando endpoints...');
        await testarEndpoints();

        // 4. Diagnóstico de problemas
        console.log('\n4️⃣ Diagnóstico...');
        await diagnosticarProblemas();

        console.log('\n🎉 TESTE CONCLUÍDO!');

    } catch (error) {
        console.error('\n💥 ERRO NO TESTE:', error);
        throw error;
    }
};

const verificarConfiguracao = async () => {
    console.log('⚙️ Ambiente:', window.location.hostname);
    
    if (window.SALALIVRE_CONFIG) {
        console.log('✅ Configuração carregada:', window.SALALIVRE_CONFIG);
    } else {
        console.log('❌ Configuração não encontrada');
        console.log('💡 Carregando config.js...');
        
        // Tentar carregar dinamicamente
        try {
            const script = document.createElement('script');
            script.src = '/js/config.js';
            document.head.appendChild(script);
            
            // Aguardar carregar
            await new Promise(resolve => {
                script.onload = resolve;
                setTimeout(resolve, 2000); // timeout
            });
            
            if (window.SALALIVRE_CONFIG) {
                console.log('✅ Configuração carregada dinamicamente');
            } else {
                console.log('❌ Falha ao carregar configuração');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar config:', error);
        }
    }
};

const testarAPIClient = async () => {
    if (window.apiClient) {
        console.log('✅ API Client encontrado');
        console.log('📡 Base URL:', window.apiClient.baseURL);
    } else if (window.salaLivreAPI) {
        console.log('✅ SalaLivreAPI encontrado');
        console.log('📡 Base URL:', window.salaLivreAPI.baseURL);
    } else {
        console.log('❌ API Client não encontrado');
        console.log('💡 Tentando inicializar...');
        
        try {
            // Tentar carregar API client
            const script = document.createElement('script');
            script.src = '/js/api-client.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.apiClient) {
                console.log('✅ API Client carregado dinamicamente');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar API Client:', error);
        }
    }
};

const testarEndpoints = async () => {
    const baseURL = window.SALALIVRE_CONFIG?.apiBaseURL || '/api';
    console.log('🔗 Testando endpoints em:', baseURL);

    const endpoints = [
        { path: '/health', method: 'GET', name: 'Health Check' },
        { path: '/users', method: 'GET', name: 'Listar Usuários' },
        { path: '/rooms', method: 'GET', name: 'Listar Salas' },
        { path: '/bookings', method: 'GET', name: 'Listar Reuniões' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🧪 Testando ${endpoint.name}...`);
            
            const response = await fetch(`${baseURL}${endpoint.path}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: OK`);
                
                if (endpoint.path === '/health') {
                    console.log(`� Database: ${data.database?.status || 'unknown'}`);
                    console.log(`�📊 Service: ${data.status || 'unknown'}`);
                } else {
                    console.log(`📊 Dados: ${Array.isArray(data) ? data.length + ' itens' : 'objeto'}`);
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
                console.log(`💬 Erro:`, errorText);
            }

        } catch (error) {
            console.log(`💥 ${endpoint.name}: ERRO -`, error.message);
        }
    }
};

const diagnosticarProblemas = async () => {
    const problemas = [];
    const solucoes = [];

    // Verificar se baseURL está configurada
    const baseURL = window.SALALIVRE_CONFIG?.apiBaseURL;
    
    if (!baseURL || baseURL.includes('SEU-SERVIDOR-BACKEND')) {
        problemas.push('❌ URL do servidor backend não configurada');
        solucoes.push('💡 Configure CONFIG.netlify.apiBaseURL em config.js');
    }

    // Verificar CORS
    try {
        const response = await fetch(baseURL + '/health', { method: 'OPTIONS' });
        if (!response.ok) {
            problemas.push('❌ Problemas de CORS');
            solucoes.push('💡 Configure CORS no servidor backend');
        }
    } catch (error) {
        problemas.push('❌ Servidor backend inacessível');
        solucoes.push('💡 Verifique se o servidor backend está rodando');
    }

    // Verificar se está usando Netlify Functions
    if (baseURL.includes('netlify/functions')) {
        problemas.push('⚠️ Usando Netlify Functions (limitado)');
        solucoes.push('💡 Considere usar servidor backend dedicado para Google Cloud SQL');
    }

    console.log('\n🔍 DIAGNÓSTICO:');
    
    if (problemas.length === 0) {
        console.log('✅ Nenhum problema detectado');
    } else {
        console.log('\n❌ PROBLEMAS ENCONTRADOS:');
        problemas.forEach(problema => console.log(problema));
        
        console.log('\n💡 SOLUÇÕES SUGERIDAS:');
        solucoes.forEach(solucao => console.log(solucao));
    }

    // Instruções específicas para Netlify
    console.log('\n📋 PRÓXIMOS PASSOS PARA NETLIFY:');
    console.log('1. Fazer deploy do servidor Express em um serviço cloud');
    console.log('2. Atualizar CONFIG.netlify.apiBaseURL com a URL real');
    console.log('3. Configurar variáveis de ambiente do Google Cloud SQL');
    console.log('4. Testar conectividade novamente');
};

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
    window.testarConectividadeNetlify = testarConectividadeNetlify;
    console.log('🧪 Teste de conectividade carregado. Execute: testarConectividadeNetlify()');
}

// Auto-executar se estiver no Netlify
if (window.location.hostname.includes('netlify.app')) {
    console.log('🌐 Detectado ambiente Netlify. Executando teste automaticamente...');
    setTimeout(() => {
        testarConectividadeNetlify().catch(console.error);
    }, 2000);
}
