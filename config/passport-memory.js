// ==================== CONFIGURAÇÃO DE USUÁRIOS EM MEMÓRIA (PARA TESTE) ====================
// Use isso enquanto não configurar o MySQL

const bcrypt = require('bcryptjs');

// Usuários pré-definidos para teste (em memória)
const testUsers = [
    {
        id: 1,
        name: 'Administrador',
        email: 'admin@salalivre.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', // admin123
        role: 'admin',
        department: 'Administração',
        active: true,
        auth_provider: 'local',
        email_verified: true,
        created_at: new Date(),
        last_login: null,
        login_count: 0
    },
    {
        id: 2,
        name: 'João Silva',
        email: 'joao@salalivre.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', // admin123
        role: 'user',
        department: 'Vendas',
        active: true,
        auth_provider: 'local',
        email_verified: true,
        created_at: new Date(),
        last_login: null,
        login_count: 0
    },
    {
        id: 3,
        name: 'Maria Santos',
        email: 'maria@salalivre.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnTDhp/X5j0wWjY6u', // admin123
        role: 'manager',
        department: 'Recursos Humanos',
        active: true,
        auth_provider: 'local',
        email_verified: true,
        created_at: new Date(),
        last_login: null,
        login_count: 0
    }
];

// ==================== FUNÇÕES PARA SIMULAR BANCO DE DADOS ====================

async function findUserByEmail(email) {
    return testUsers.find(user => user.email.toLowerCase() === email.toLowerCase() && user.active);
}

async function findUserById(id) {
    return testUsers.find(user => user.id === parseInt(id) && user.active);
}

async function createUser(userData) {
    const {
        name,
        email,
        password,
        role = 'user',
        department = null,
        auth_provider = 'local'
    } = userData;
    
    // Verificar se email já existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('E-mail já está em uso');
    }
    
    // Hash da senha se for autenticação local
    let hashedPassword = null;
    if (password) {
        const salt = await bcrypt.genSalt(12);
        hashedPassword = await bcrypt.hash(password, salt);
    }
    
    const newUser = {
        id: testUsers.length + 1,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        department,
        auth_provider,
        active: true,
        email_verified: auth_provider === 'google',
        created_at: new Date(),
        last_login: null,
        login_count: 0
    };
    
    testUsers.push(newUser);
    return newUser.id;
}

async function updateUserLogin(userId) {
    const user = testUsers.find(u => u.id === userId);
    if (user) {
        user.last_login = new Date();
        user.login_count += 1;
    }
}

// ==================== CONFIGURAÇÃO PASSPORT ALTERNATIVA ====================
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function(passport) {
    
    // ==================== ESTRATÉGIA LOCAL ====================
    passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            console.log('🔍 Tentativa de login:', email);
            
            // Buscar usuário pelo email
            const user = await findUserByEmail(email);
            
            if (!user) {
                console.log('❌ Usuário não encontrado:', email);
                return done(null, false, { message: 'E-mail não encontrado' });
            }
            
            console.log('✅ Usuário encontrado:', user.name);
            
            // Verificar senha
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                console.log('❌ Senha incorreta para:', email);
                return done(null, false, { message: 'Senha incorreta' });
            }
            
            console.log('✅ Login bem-sucedido:', user.name);
            
            // Atualizar último login
            await updateUserLogin(user.id);
            
            // Remover senha do objeto de retorno
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            
            return done(null, userWithoutPassword);
            
        } catch (error) {
            console.error('❌ Erro na estratégia local:', error);
            return done(error);
        }
    }));
    
    // ==================== ESTRATÉGIA GOOGLE ====================
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use('google', new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const avatar = profile.photos[0].value;
                
                // Verificar se usuário já existe
                let user = await findUserByEmail(email);
                
                if (user) {
                    // Usuário existe, atualizar informações do Google
                    user.google_id = googleId;
                    user.avatar = avatar;
                    await updateUserLogin(user.id);
                } else {
                    // Criar novo usuário
                    const userId = await createUser({
                        name,
                        email,
                        google_id: googleId,
                        avatar,
                        auth_provider: 'google',
                        email_verified: true
                    });
                    
                    user = await findUserById(userId);
                }
                
                // Remover informações sensíveis
                delete user.password;
                
                return done(null, user);
                
            } catch (error) {
                console.error('Erro na estratégia Google:', error);
                return done(error);
            }
        }));
    }
    
    // ==================== SERIALIZAÇÃO ====================
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await findUserById(id);
            
            if (!user) {
                return done(null, false);
            }
            
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            
            done(null, userWithoutPassword);
            
        } catch (error) {
            console.error('Erro na deserialização:', error);
            done(error);
        }
    });
};

// ==================== EXPORTS ====================
module.exports.createUser = createUser;
module.exports.findUserByEmail = findUserByEmail;
module.exports.findUserById = findUserById;
module.exports.testUsers = testUsers;
