// ==================== IMPORTS ====================
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// ==================== CONFIGURAÇÃO DO APP ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARES ====================
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ==================== CONFIGURAÇÃO DO PASSPORT ====================
// ==================== CONFIGURAÇÃO DO PASSPORT ====================
// Usar configuração para Google Cloud SQL (MySQL)
require('./config/passport')(passport);

// ==================== ROTAS ====================
// Rota principal - servir login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota de demonstração
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'demo.html'));
});

// Rota do dashboard (será criada depois)
app.get('/dashboard', (req, res) => {
    // Por enquanto, redirecionar para login se não autenticado
    res.redirect('/login');
});

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/rooms', require('./routes/rooms'));
// app.use('/api/bookings', require('./routes/bookings'));

// ==================== MIDDLEWARE DE ERRO ====================
app.use((err, req, res, next) => {
    console.error('Erro:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== ROTA 404 ====================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// ==================== INICIALIZAÇÃO DO SERVIDOR ====================
app.listen(PORT, () => {
    console.log(`
    🚀 Servidor Reunião Fácil iniciado!
    
    📍 URL: http://localhost:${PORT}
    🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
    📅 Data: ${new Date().toLocaleString('pt-BR')}
    
    🎯 Funcionalidades disponíveis:
    • Login/Cadastro: http://localhost:${PORT}/login
    • Dashboard: http://localhost:${PORT}/dashboard
    • API Auth: http://localhost:${PORT}/api/auth
    
    💡 Para configurar o banco de dados, execute:
    npm run setup-db
    `);
});

// ==================== TRATAMENTO DE SINAIS ====================
process.on('SIGTERM', () => {
    console.log('📴 Servidor sendo encerrado...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Servidor interrompido pelo usuário');
    process.exit(0);
});

module.exports = app;
