// ==================== CONFIGURAÇÃO API ====================
// Configure o URL da sua API no backend (Google Cloud, Heroku, etc.)
const API_BASE_URL = 'http://localhost:3000'; // Para desenvolvimento local
// const API_BASE_URL = 'https://sua-api-sala-livre.appspot.com'; // Para produção Google Cloud

// ==================== VARIÁVEIS GLOBAIS ====================
let currentTab = 'login';
let googleAuth = null;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    initializeGoogleAuth();
    setupPasswordStrengthChecker();
    setupFormValidation();
    
    // Verificar se há token salvo
    checkSavedToken();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
    
    // Toggle de senha
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', togglePassword);
    });
    
    // Formulários
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Google Auth
    document.getElementById('googleSignIn').addEventListener('click', () => handleGoogleAuth('login'));
    document.getElementById('googleSignUp').addEventListener('click', () => handleGoogleAuth('register'));
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('messageModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Escape key para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // Links especiais
    document.querySelector('.forgot-password').addEventListener('click', handleForgotPassword);
}

// ==================== NAVEGAÇÃO DE ABAS ====================
function handleTabClick(e) {
    const tabName = e.target.closest('.tab-button').dataset.tab;
    switchTab(tabName);
}

function switchTab(tabName) {
    // Atualizar variável global
    currentTab = tabName;
    
    // Remover classe active de todas as abas e formulários
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    
    // Adicionar classe active na aba e formulário corretos
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).classList.add('active');
    
    // Limpar formulários
    clearFormErrors();
}

// ==================== TOGGLE DE SENHA ====================
function togglePassword(e) {
    const targetId = e.target.closest('.toggle-password').dataset.target;
    const passwordInput = document.getElementById(targetId);
    const icon = e.target.closest('.toggle-password').querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ==================== VERIFICADOR DE FORÇA DA SENHA ====================
function setupPasswordStrengthChecker() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthContainer = document.querySelector('.password-strength');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strength, strengthContainer);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Critérios de força
    if (password.length >= 8) score += 25;
    else feedback.push('Mínimo 8 caracteres');
    
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push('Letra minúscula');
    
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push('Letra maiúscula');
    
    if (/[0-9]/.test(password)) score += 25;
    else feedback.push('Número');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    else feedback.push('Caractere especial');
    
    // Determinar nível
    let level = 'weak';
    if (score >= 75) level = 'strong';
    else if (score >= 50) level = 'medium';
    
    return { score, level, feedback };
}

function updatePasswordStrengthUI(strength, container) {
    const strengthBar = container.querySelector('.strength-fill');
    const strengthText = container.querySelector('.strength-text');
    
    // Remover classes anteriores
    container.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    
    // Adicionar nova classe
    container.classList.add(`strength-${strength.level}`);
    
    // Atualizar texto
    const levelTexts = {
        weak: 'Fraca',
        medium: 'Média',
        strong: 'Forte'
    };
    
    strengthText.textContent = `Força: ${levelTexts[strength.level]}`;
    
    // Mostrar feedback se necessário
    if (strength.feedback.length > 0 && strength.level === 'weak') {
        strengthText.textContent += ` (${strength.feedback.join(', ')})`;
    }
}

// ==================== VALIDAÇÃO DE FORMULÁRIOS ====================
function setupFormValidation() {
    // Validação em tempo real
    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Validação de confirmação de senha
    document.getElementById('confirmPassword').addEventListener('input', validatePasswordConfirmation);
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(field);
    
    // Validações específicas
    if (field.type === 'email' && value) {
        if (!isValidEmail(value)) {
            showFieldError(field, 'E-mail inválido');
            return false;
        }
    }
    
    if (field.name === 'password' && value) {
        if (value.length < 6) {
            showFieldError(field, 'Senha deve ter pelo menos 6 caracteres');
            return false;
        }
    }
    
    if (field.name === 'name' && value) {
        if (value.length < 2) {
            showFieldError(field, 'Nome deve ter pelo menos 2 caracteres');
            return false;
        }
    }
    
    return true;
}

function validatePasswordConfirmation() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    clearFieldError(document.getElementById('confirmPassword'));
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(document.getElementById('confirmPassword'), 'Senhas não coincidem');
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    // Remover mensagem anterior
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    // Adicionar nova mensagem
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
}

function clearFieldError(field) {
    if (field.target) field = field.target; // Para eventos
    
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error', 'success');
    
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
}

function clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'success');
    });
    document.querySelectorAll('.error-message, .success-message').forEach(msg => msg.remove());
}

// ==================== UTILITÁRIOS ====================
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showModal(title, message, type = 'info') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('messageModal').style.display = 'block';
    
    // Adicionar classe baseada no tipo
    const modal = document.getElementById('messageModal');
    modal.className = `modal modal-${type}`;
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// ==================== AUTENTICAÇÃO GOOGLE ====================
function initializeGoogleAuth() {
    // Configurar Google Sign-In
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: 'SEU_GOOGLE_CLIENT_ID_AQUI', // CONFIGURE AQUI
            callback: handleGoogleSignInResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });
    }
}

function handleGoogleAuth(type) {
    if (typeof google === 'undefined') {
        showModal('Erro', 'Google Sign-In não está disponível no momento.', 'error');
        return;
    }
    
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback para popup
            google.accounts.id.renderButton(
                document.createElement('div'),
                { theme: 'outline', size: 'large' }
            );
        }
    });
}

function handleGoogleSignInResponse(response) {
    showLoading();
    
    // Decodificar o JWT token do Google
    const userData = parseJWT(response.credential);
    
    // Enviar para o servidor
    fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: response.credential,
            userData: userData,
            type: currentTab
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            // Salvar token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            showModal('Sucesso!', 'Login realizado com sucesso!', 'success');
            
            // Redirecionar após 2 segundos para o dashboard
            setTimeout(() => {
                window.location.href = `${API_BASE_URL}/dashboard`;
            }, 2000);
        } else {
            showModal('Erro', data.message || 'Erro ao fazer login com Google', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Erro:', error);
        showModal('Erro', 'Erro de conexão. Verifique se a API está online.', 'error');
    });
}

function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erro ao decodificar JWT:', error);
        return null;
    }
}

// ==================== LOGIN TRADICIONAL ====================
function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validar campos
    if (!validateLoginForm(data)) {
        return;
    }
    
    showLoading();
    
    fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        hideLoading();
        
        if (result.success) {
            // Salvar dados do usuário
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userData', JSON.stringify(result.user));
            
            // Lembrar usuário se solicitado
            if (data.rememberMe) {
                localStorage.setItem('rememberUser', data.email);
            }
            
            showModal('Sucesso!', 'Login realizado com sucesso!', 'success');
            
            // Redirecionar
            setTimeout(() => {
                window.location.href = `${API_BASE_URL}/dashboard`;
            }, 2000);
        } else {
            showModal('Erro', result.message || 'Credenciais inválidas', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Erro:', error);
        showModal('Erro', 'Erro de conexão. Verifique se a API está online.', 'error');
    });
}

function validateLoginForm(data) {
    let isValid = true;
    
    // Validar email
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError(document.getElementById('loginEmail'), 'E-mail inválido');
        isValid = false;
    }
    
    // Validar senha
    if (!data.password || data.password.length < 1) {
        showFieldError(document.getElementById('loginPassword'), 'Senha é obrigatória');
        isValid = false;
    }
    
    return isValid;
}

// ==================== REGISTRO ====================
function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validar campos
    if (!validateRegisterForm(data)) {
        return;
    }
    
    showLoading();
    
    fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        hideLoading();
        
        if (result.success) {
            showModal('Sucesso!', 'Conta criada com sucesso! Você pode fazer login agora.', 'success');
            
            // Limpar formulário
            form.reset();
            
            // Voltar para aba de login após 3 segundos
            setTimeout(() => {
                switchTab('login');
                // Preencher email no login
                document.getElementById('loginEmail').value = data.email;
            }, 3000);
        } else {
            showModal('Erro', result.message || 'Erro ao criar conta', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Erro:', error);
        showModal('Erro', 'Erro de conexão. Verifique se a API está online.', 'error');
    });
}

function validateRegisterForm(data) {
    let isValid = true;
    
    // Validar nome
    if (!data.name || data.name.trim().length < 2) {
        showFieldError(document.getElementById('registerName'), 'Nome deve ter pelo menos 2 caracteres');
        isValid = false;
    }
    
    // Validar email
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError(document.getElementById('registerEmail'), 'E-mail inválido');
        isValid = false;
    }
    
    // Validar senha
    if (!data.password || data.password.length < 6) {
        showFieldError(document.getElementById('registerPassword'), 'Senha deve ter pelo menos 6 caracteres');
        isValid = false;
    }
    
    // Validar confirmação de senha
    if (data.password !== data.confirmPassword) {
        showFieldError(document.getElementById('confirmPassword'), 'Senhas não coincidem');
        isValid = false;
    }
    
    // Validar termos
    if (!data.acceptTerms) {
        showModal('Atenção', 'Você deve aceitar os termos de uso para continuar.', 'error');
        isValid = false;
    }
    
    return isValid;
}

// ==================== ESQUECI MINHA SENHA ====================
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Digite seu e-mail para recuperar a senha:');
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
        showModal('Erro', 'Por favor, digite um e-mail válido.', 'error');
        return;
    }
    
    showLoading();
    
    fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(result => {
        hideLoading();
        
        if (result.success) {
            showModal('Sucesso!', 'Instruções para recuperar a senha foram enviadas para seu e-mail.', 'success');
        } else {
            showModal('Erro', result.message || 'Erro ao enviar e-mail de recuperação', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Erro:', error);
        showModal('Erro', 'Erro de conexão. Verifique se a API está online.', 'error');
    });
}

// ==================== VERIFICAÇÃO DE TOKEN SALVO ====================
function checkSavedToken() {
    const token = localStorage.getItem('authToken');
    const rememberedUser = localStorage.getItem('rememberUser');
    
    if (rememberedUser) {
        document.getElementById('loginEmail').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }
    
    if (token) {
        // Verificar se o token ainda é válido
        fetch(`${API_BASE_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.valid) {
                // Token válido, redirecionar para dashboard
                window.location.href = `${API_BASE_URL}/dashboard`;
            } else {
                // Token inválido, remover do localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            }
        })
        .catch(error => {
            console.error('Erro ao verificar token:', error);
            // Em caso de erro, remover token por segurança
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        });
    }
}

// ==================== ACESSIBILIDADE ====================
// Adicionar suporte a teclas de atalho
document.addEventListener('keydown', function(e) {
    // Enter para submeter formulário ativo
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const activeForm = document.querySelector('.form-container.active form');
        if (activeForm) {
            e.preventDefault();
            activeForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Tab para navegar entre abas (Ctrl + Tab)
    if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const nextTab = currentTab === 'login' ? 'register' : 'login';
        switchTab(nextTab);
    }
});
