// ==================== IMPORTS ====================
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// ==================== CONFIGURAÇÃO DO BANCO ====================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reuniao_facil',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ==================== CONFIGURAÇÃO DO PASSPORT ====================
module.exports = function(passport) {
    
    // ==================== ESTRATÉGIA LOCAL ====================
    passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const connection = await pool.getConnection();
            
            try {
                // Buscar usuário pelo email
                const [rows] = await connection.execute(
                    'SELECT * FROM users WHERE email = ? AND active = 1',
                    [email]
                );
                
                if (rows.length === 0) {
                    return done(null, false, { message: 'E-mail não encontrado' });
                }
                
                const user = rows[0];
                
                // Verificar senha
                const isMatch = await bcrypt.compare(password, user.password);
                
                if (!isMatch) {
                    return done(null, false, { message: 'Senha incorreta' });
                }
                
                // Atualizar último login
                await connection.execute(
                    'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
                    [user.id]
                );
                
                // Remover senha do objeto de retorno
                delete user.password;
                
                return done(null, user);
                
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro na estratégia local:', error);
            return done(error);
        }
    }));
    
    // ==================== ESTRATÉGIA GOOGLE ====================
    passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const connection = await pool.getConnection();
            
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const avatar = profile.photos[0].value;
                
                // Verificar se usuário já existe
                const [existingUsers] = await connection.execute(
                    'SELECT * FROM users WHERE email = ? OR google_id = ?',
                    [email, googleId]
                );
                
                let user;
                
                if (existingUsers.length > 0) {
                    // Usuário existe, atualizar informações
                    user = existingUsers[0];
                    
                    await connection.execute(`
                        UPDATE users SET 
                            google_id = ?,
                            name = ?,
                            avatar = ?,
                            last_login = NOW(),
                            login_count = login_count + 1,
                            updated_at = NOW()
                        WHERE id = ?
                    `, [googleId, name, avatar, user.id]);
                    
                } else {
                    // Criar novo usuário
                    const [result] = await connection.execute(`
                        INSERT INTO users (
                            name, email, google_id, avatar, auth_provider, 
                            email_verified, active, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, 'google', 1, 1, NOW(), NOW())
                    `, [name, email, googleId, avatar]);
                    
                    user = {
                        id: result.insertId,
                        name,
                        email,
                        google_id: googleId,
                        avatar,
                        auth_provider: 'google',
                        role: 'user',
                        active: 1,
                        email_verified: 1
                    };
                }
                
                // Remover informações sensíveis
                delete user.password;
                
                return done(null, user);
                
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro na estratégia Google:', error);
            return done(error);
        }
    }));
    
    // ==================== SERIALIZAÇÃO ====================
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const connection = await pool.getConnection();
            
            try {
                const [rows] = await connection.execute(
                    'SELECT * FROM users WHERE id = ? AND active = 1',
                    [id]
                );
                
                if (rows.length === 0) {
                    return done(null, false);
                }
                
                const user = rows[0];
                delete user.password; // Remover senha
                
                done(null, user);
                
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro na deserialização:', error);
            done(error);
        }
    });
};

// ==================== FUNÇÕES AUXILIARES ====================
async function createUser(userData) {
    const connection = await pool.getConnection();
    
    try {
        const {
            name,
            email,
            password,
            role = 'user',
            department = null,
            auth_provider = 'local'
        } = userData;
        
        // Hash da senha se for autenticação local
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(12);
            hashedPassword = await bcrypt.hash(password, salt);
        }
        
        const [result] = await connection.execute(`
            INSERT INTO users (
                name, email, password, role, department, auth_provider,
                active, email_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
        `, [name, email, hashedPassword, role, department, auth_provider]);
        
        return result.insertId;
        
    } finally {
        connection.release();
    }
}

async function findUserByEmail(email) {
    const connection = await pool.getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE email = ? AND active = 1',
            [email]
        );
        
        return rows.length > 0 ? rows[0] : null;
        
    } finally {
        connection.release();
    }
}

async function findUserById(id) {
    const connection = await pool.getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE id = ? AND active = 1',
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
        
    } finally {
        connection.release();
    }
}

// ==================== EXPORTS ====================
module.exports.createUser = createUser;
module.exports.findUserByEmail = findUserByEmail;
module.exports.findUserById = findUserById;
module.exports.pool = pool;
