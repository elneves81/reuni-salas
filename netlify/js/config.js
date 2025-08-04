// ==================== CONFIGURAÇÕES DO AMBIENTE ====================

const CONFIG = {
    // Configurações para desenvolvimento local
    development: {
        apiBaseURL: 'http://localhost:3000/api',
        wsBaseURL: 'ws://localhost:3000',
        database: 'local'
    },
    
    // Configurações para produção
    production: {
        // IMPORTANTE: Substitua pela URL real do seu servidor backend
        apiBaseURL: 'https://SEU-SERVIDOR-BACKEND.herokuapp.com/api', // ou Google Cloud Run
        wsBaseURL: 'wss://SEU-SERVIDOR-BACKEND.herokuapp.com',
        database: 'google-cloud-sql'
    },
    
    // Configurações para Netlify (usando Functions + Google Cloud SQL)
    netlify: {
        // Usar Netlify Functions que conectam ao Google Cloud SQL
        apiBaseURL: '/api',  // Rotas redirecionadas para /.netlify/functions/
        wsBaseURL: null,     // WebSocket não disponível via functions
        database: 'google-cloud-sql-via-functions'
    }
};

// Detectar ambiente atual
function getCurrentEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('netlify.app')) {
        return 'netlify';
    } else {
        return 'production';
    }
}

// Exportar configuração atual
const currentConfig = CONFIG[getCurrentEnvironment()];

console.log(`🌍 Ambiente detectado: ${getCurrentEnvironment()}`);
console.log('⚙️ Configuração:', currentConfig);

// Disponibilizar globalmente
window.SALALIVRE_CONFIG = currentConfig;

// ==================== INSTRUÇÕES DE DEPLOY ====================
/*

PARA FAZER A PÁGINA https://salalivre.netlify.app/ FUNCIONAR COM BANCO:

1. OPÇÃO RECOMENDADA - Servidor Backend Separado:
   - Deploy o servidor Express (server.js) no Heroku, Google Cloud Run, ou outro serviço
   - Atualize CONFIG.netlify.apiBaseURL com a URL real do servidor
   - O servidor terá acesso direto ao Google Cloud SQL

2. OPÇÃO ALTERNATIVA - Netlify Functions como Proxy:
   - Crear functions que façam proxy para um servidor backend
   - Mais limitado, mas possível para operações simples

EXEMPLO DE DEPLOY NO HEROKU:
1. heroku create seu-salalivre-backend
2. heroku config:set DB_HOST=SEU_GOOGLE_CLOUD_SQL_IP
3. heroku config:set DB_USER=app_user
4. heroku config:set DB_PASS=SUA_SENHA
5. heroku config:set DB_NAME=sala_livre
6. git push heroku main
7. Atualizar CONFIG.netlify.apiBaseURL = 'https://seu-salalivre-backend.herokuapp.com/api'

*/
