// ==================== IMPORTS ====================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { createUser, findUserByEmail, findUserById } = require('../config/passport');

// ==================== MIDDLEWARES ====================
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET || 'default-secret',
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
        }
    );
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acesso requerido'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
}

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// ==================== LOGIN LOCAL ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        // Validações básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'E-mail e senha são obrigatórios'
            });
        }
        
        // Buscar usuário
        const user = await findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Verificar senha
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Verificar se conta está ativa
        if (!user.active) {
            return res.status(401).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o administrador.'
            });
        }
        
        // Gerar token
        const token = generateToken(user);
        
        // Remover senha do objeto de resposta
        delete user.password;
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== REGISTRO LOCAL ====================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, acceptTerms } = req.body;
        
        // Validações básicas
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Senhas não coincidem'
            });
        }
        
        if (!acceptTerms) {
            return res.status(400).json({
                success: false,
                message: 'Você deve aceitar os termos de uso'
            });
        }
        
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de e-mail inválido'
            });
        }
        
        // Validar força da senha
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }
        
        // Verificar se usuário já existe
        const existingUser = await findUserByEmail(email);
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'E-mail já está em uso'
            });
        }
        
        // Criar usuário
        const userId = await createUser({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: 'user',
            auth_provider: 'local'
        });
        
        res.status(201).json({
            success: true,
            message: 'Conta criada com sucesso! Você pode fazer login agora.',
            userId
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== AUTENTICAÇÃO GOOGLE ====================
router.post('/google', async (req, res) => {
    try {
        const { token, userData, type } = req.body;
        
        if (!token || !userData) {
            return res.status(400).json({
                success: false,
                message: 'Dados do Google são obrigatórios'
            });
        }
        
        const { email, name, picture, sub: googleId } = userData;
        
        // Verificar se usuário já existe
        let user = await findUserByEmail(email);
        
        if (user) {
            // Usuário existe, atualizar dados do Google se necessário
            if (!user.google_id) {
                // Vincular conta Google à conta existente
                // Implementar lógica de atualização aqui
            }
        } else if (type === 'register') {
            // Criar novo usuário com dados do Google
            const userId = await createUser({
                name,
                email,
                google_id: googleId,
                avatar: picture,
                auth_provider: 'google',
                email_verified: true
            });
            
            user = await findUserById(userId);
        } else {
            return res.status(404).json({
                success: false,
                message: 'Conta não encontrada. Crie uma conta primeiro.'
            });
        }
        
        // Gerar token
        const authToken = generateToken(user);
        
        // Remover senha do objeto de resposta
        delete user.password;
        
        res.json({
            success: true,
            message: 'Autenticação Google realizada com sucesso',
            token: authToken,
            user,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
        
    } catch (error) {
        console.error('Erro na autenticação Google:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== VERIFICAÇÃO DE TOKEN ====================
router.post('/verify-token', verifyToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        
        if (!user || !user.active) {
            return res.status(401).json({
                valid: false,
                message: 'Token inválido ou usuário desativado'
            });
        }
        
        delete user.password;
        
        res.json({
            valid: true,
            user
        });
        
    } catch (error) {
        console.error('Erro na verificação de token:', error);
        res.status(500).json({
            valid: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== RECUPERAÇÃO DE SENHA ====================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-mail é obrigatório'
            });
        }
        
        const user = await findUserByEmail(email);
        
        if (!user) {
            // Por segurança, sempre retorna sucesso
            return res.json({
                success: true,
                message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
            });
        }
        
        // Gerar token de recuperação (implementar lógica de envio de email)
        const resetToken = jwt.sign(
            { id: user.id, type: 'password-reset' },
            process.env.JWT_SECRET + user.password, // Usar senha atual como parte do secret
            { expiresIn: '1h' }
        );
        
        // TODO: Implementar envio de email
        console.log(`Token de recuperação para ${email}: ${resetToken}`);
        
        res.json({
            success: true,
            message: 'Instruções para redefinir sua senha foram enviadas para seu e-mail.'
        });
        
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== REDEFINIÇÃO DE SENHA ====================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Senhas não coincidem'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }
        
        // TODO: Implementar lógica de redefinição de senha
        
        res.json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro na redefinição de senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== LOGOUT ====================
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // TODO: Implementar blacklist de tokens se necessário
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== PERFIL DO USUÁRIO ====================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        delete user.password;
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==================== ROTA DE TESTE ====================
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API de autenticação funcionando!',
        timestamp: new Date().toISOString()
    });
});

// ==================== EXPORTS ====================
module.exports = router;
