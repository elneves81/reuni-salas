// ==================== TESTE RÁPIDO DO SISTEMA ====================

// Função para testar se tudo está funcionando
async function testeRapidoSistema() {
    console.log('🧪 === TESTE RÁPIDO DO SISTEMA ===');
    
    // 1. Verificar se API está carregada
    console.log('1. Verificando API...');
    if (window.salaLivreAPI) {
        console.log('✅ API Client carregada');
        
        // Verificar se está autenticada
        if (window.salaLivreAPI.isAuthenticated()) {
            console.log('✅ Usuário autenticado');
            
            const usuario = window.salaLivreAPI.getCurrentUser();
            console.log('👤 Usuário atual:', usuario.name, '- Role:', usuario.role);
            
            // Verificar se é admin
            if (window.salaLivreAPI.isAdmin()) {
                console.log('👑 Usuário é ADMIN - pode gerenciar usuários');
            } else {
                console.log('👤 Usuário é ' + usuario.role + ' - sem permissões admin');
            }
        } else {
            console.log('🔒 Usuário não autenticado');
        }
    } else {
        console.log('❌ API Client não carregada');
    }
    
    // 2. Verificar gerenciamento de usuários
    console.log('2. Verificando gerenciamento de usuários...');
    if (window.userManagementAPI) {
        console.log('✅ Sistema de gerenciamento de usuários carregado');
    } else {
        console.log('❌ Sistema de gerenciamento de usuários não carregado');
    }
    
    // 3. Verificar sistema de notificações
    console.log('3. Verificando sistema de notificações...');
    if (window.notificationSystem) {
        console.log('✅ Sistema de notificações carregado');
        // Enviar notificação teste
        window.notificationSystem.addNotification('info', 'Teste', 'Sistema funcionando perfeitamente! 🎉');
    } else {
        console.log('❌ Sistema de notificações não carregado');
    }
    
    // 4. Verificar calendário (com aguardar)
    console.log('4. Verificando calendário...');
    await waitForCalendar();
    
    console.log('🧪 === FIM DO TESTE ===');
}

// Função para aguardar o calendário estar pronto
async function waitForCalendar(maxTries = 5) {
    for (let i = 0; i < maxTries; i++) {
        if (window.calendar && typeof window.calendar.getEvents === 'function') {
            console.log('✅ Calendário FullCalendar inicializado');
            try {
                const eventos = window.calendar.getEvents();
                console.log('📅 Eventos no calendário:', eventos.length);
                return;
            } catch (error) {
                console.log('⚠️ Erro ao obter eventos:', error.message);
            }
        }
        
        console.log(`⏳ Aguardando calendário... (tentativa ${i + 1}/${maxTries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('❌ Calendário não ficou disponível após aguardar');
}

// Executar teste quando página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para todos os scripts carregarem
    setTimeout(testeRapidoSistema, 3000);
});

// Tornar função disponível globalmente para teste manual
window.testeRapidoSistema = testeRapidoSistema;
window.waitForCalendar = waitForCalendar;

console.log('🧪 Teste do sistema carregado! Execute testeRapidoSistema() para verificar.');
