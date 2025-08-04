// ==================== GUIA PARA CORRIGIR ACESSO AO BANCO ====================

console.log('🔧 PROBLEMA IDENTIFICADO: IP NÃO AUTORIZADO');
console.log('=' .repeat(60));

console.log('\n❌ ERRO ATUAL:');
console.log('Access denied for user \'root\'@\'177.87.200.82\' (using password: YES)');

console.log('\n🎯 SOLUÇÃO: Autorizar IP 177.87.200.82 no Google Cloud SQL');

console.log('\n📋 PASSOS PARA CORRIGIR:');
console.log('1. 🌐 Acesse: https://console.cloud.google.com/sql');
console.log('2. 📁 Selecione o projeto: reunipro-443018');
console.log('3. 🗄️  Clique na instância: sala-livre-instance');
console.log('4. 🔌 Vá para aba "Connections"');
console.log('5. 📝 Em "Authorized networks", clique "Add network"');
console.log('6. 🆔 Nome: "IP Local Desenvolvimento"');
console.log('7. 🌐 Network: 177.87.200.82/32');
console.log('8. ✅ Clique "Save"');
console.log('9. ⏳ Aguarde 2-3 minutos para aplicar');

console.log('\n🔍 INFORMAÇÕES DO BANCO:');
console.log('- Host: 34.45.56.79');
console.log('- User: root');
console.log('- Password: Elber@2025');
console.log('- Database: sala_livre');
console.log('- Port: 3306');

console.log('\n🔧 ALTERNATIVA VIA GCLOUD CLI:');
console.log('Se tiver o gcloud instalado, execute:');
console.log('gcloud sql instances patch sala-livre-instance \\');
console.log('  --authorized-networks=177.87.200.82 \\');
console.log('  --project=reunipro-443018');

console.log('\n⚡ TESTE RÁPIDO:');
console.log('Após autorizar o IP, execute: node diagnosticar-banco.js');

console.log('\n🚨 ATENÇÃO:');
console.log('- Este IP pode mudar se você reiniciar o roteador');
console.log('- Para produção, use IPs fixos ou VPN');
console.log('- Considere usar Cloud SQL Proxy para maior segurança');

console.log('\n🎉 PRÓXIMOS PASSOS:');
console.log('1. Autorize o IP no Google Cloud Console');
console.log('2. Execute: node diagnosticar-banco.js');
console.log('3. Se funcionar, execute: node testar-reservas-completo.js');
console.log('4. Configure as variáveis de ambiente no Netlify');

// Função para testar conexão após autorização
function testarAposAutorizacao() {
    console.log('\n🧪 Para testar após autorizar IP:');
    console.log('node diagnosticar-banco.js');
}

// Função para mostrar as variáveis de ambiente necessárias no Netlify
function mostrarVariaveisNetlify() {
    console.log('\n🔧 VARIÁVEIS DE AMBIENTE PARA NETLIFY:');
    console.log('DB_HOST=34.45.56.79');
    console.log('DB_USER=root');
    console.log('DB_PASSWORD=Elber@2025');
    console.log('DB_NAME=sala_livre');
    console.log('DB_PORT=3306');
}

testarAposAutorizacao();
mostrarVariaveisNetlify();
