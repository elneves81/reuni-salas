// ==================== SISTEMA DE GERENCIAMENTO DE USUÁRIOS COM API ====================

class UserManagementAPI {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('👥 Inicializando gerenciamento de usuários com API...');
        
        // Aguardar API estar disponível
        if (!window.salaLivreAPI) {
            console.log('⏳ Aguardando API estar disponível...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Verificar se usuário está autenticado
        if (!window.salaLivreAPI.isAuthenticated()) {
            console.log('🔒 Usuário não autenticado');
            return;
        }

        // Verificar se é admin
        if (!window.salaLivreAPI.isAdmin()) {
            console.log('👤 Usuário não é admin, gerenciamento não disponível');
            this.hideAdminElements();
            return;
        }

        await this.loadUsers();
        this.setupEventListeners();
        this.showAdminElements();
    }

    async loadUsers() {
        try {
            this.isLoading = true;
            this.showLoader();

            console.log('📋 Carregando usuários...');
            const response = await window.salaLivreAPI.getUsers();
            
            if (response.success) {
                this.users = response.data;
                console.log(`✅ ${this.users.length} usuários carregados`);
                this.renderUsers();
                this.updateUserStats();
            } else {
                this.showError('Erro ao carregar usuários: ' + response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            this.showError('Erro ao carregar usuários: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoader();
        }
    }

    setupEventListeners() {
        // Botão adicionar usuário
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showCreateUserModal());
        }

        // Filtros
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }

        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => this.filterUsersByRole(e.target.value));
        }

        // Modal de usuário
        this.setupUserModal();
    }

    renderUsers() {
        const container = document.getElementById('usersContainer');
        const tableBody = document.getElementById('usersTableBody');
        
        if (container) {
            this.renderUsersCards(container);
        }
        
        if (tableBody) {
            this.renderUsersTable(tableBody);
        }
    }

    renderUsersCards(container) {
        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <p>Nenhum usuário encontrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.users.map(user => this.createUserCard(user)).join('');
    }

    renderUsersTable(tableBody) {
        if (this.users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="no-data">
                            <i class="fas fa-users"></i>
                            <p>Nenhum usuário encontrado</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.users.map(user => `
            <tr data-user-id="${user.id}" class="${!user.active ? 'user-inactive' : ''}">
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${user.avatar ? 
                                `<img src="${user.avatar}" alt="${user.name}">` : 
                                `<i class="fas ${this.getUserIcon(user.role)}"></i>`
                            }
                        </div>
                        <div>
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${this.getRoleLabel(user.role)}
                    </span>
                </td>
                <td>${user.department || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <span class="auth-provider ${user.auth_provider}">
                        <i class="fas ${user.auth_provider === 'google' ? 'fa-google' : 'fa-envelope'}"></i>
                        ${user.auth_provider === 'google' ? 'Google' : 'Local'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <div class="user-actions">
                        <button class="action-btn edit" onclick="userManagementAPI.editUser(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.auth_provider !== 'google' ? `
                            <button class="action-btn password" onclick="userManagementAPI.resetPassword(${user.id})" title="Redefinir Senha">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                        ${user.active ? 
                            `<button class="action-btn deactivate" onclick="userManagementAPI.toggleUserStatus(${user.id}, false)" title="Desativar">
                                <i class="fas fa-user-slash"></i>
                            </button>` :
                            `<button class="action-btn activate" onclick="userManagementAPI.toggleUserStatus(${user.id}, true)" title="Ativar">
                                <i class="fas fa-user-check"></i>
                            </button>`
                        }
                        <button class="action-btn delete" onclick="userManagementAPI.confirmDeleteUser(${user.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    createUserCard(user) {
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-card-header">
                    <div class="user-card-avatar ${user.role}">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.name}">` : 
                            `<i class="fas ${this.getUserIcon(user.role)}"></i>`
                        }
                    </div>
                    <div class="user-card-info">
                        <h3>${user.name}</h3>
                        <span class="user-card-role role-${user.role}">${this.getRoleLabel(user.role)}</span>
                        <span class="user-card-status status-${user.active ? 'active' : 'inactive'}">
                            ${user.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                <div class="user-card-details">
                    <div class="user-card-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${user.email}</span>
                    </div>
                    <div class="user-card-detail">
                        <i class="fas fa-building"></i>
                        <span>${user.department || 'Não informado'}</span>
                    </div>
                    <div class="user-card-detail">
                        <i class="fas fa-phone"></i>
                        <span>${user.phone || 'Não informado'}</span>
                    </div>
                    <div class="user-card-detail">
                        <i class="fas fa-clock"></i>
                        <span>Criado: ${new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div class="user-card-actions">
                    <button class="btn-icon btn-primary" onclick="userManagementAPI.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.auth_provider !== 'google' ? `
                        <button class="btn-icon btn-warning" onclick="userManagementAPI.resetPassword(${user.id})" title="Redefinir Senha">
                            <i class="fas fa-key"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon ${user.active ? 'btn-secondary' : 'btn-success'}" 
                            onclick="userManagementAPI.toggleUserStatus(${user.id}, ${!user.active})" 
                            title="${user.active ? 'Desativar' : 'Ativar'}">
                        <i class="fas fa-${user.active ? 'user-slash' : 'user-check'}"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="userManagementAPI.confirmDeleteUser(${user.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    updateUserStats() {
        const stats = {
            total: this.users.length,
            active: this.users.filter(u => u.active).length,
            inactive: this.users.filter(u => !u.active).length,
            admins: this.users.filter(u => u.role === 'admin').length,
            managers: this.users.filter(u => u.role === 'manager').length,
            users: this.users.filter(u => u.role === 'user').length
        };

        // Atualizar elementos de estatísticas se existirem
        const statsElements = {
            'totalUsers': stats.total,
            'activeUsers': stats.active,
            'inactiveUsers': stats.inactive,
            'adminUsers': stats.admins,
            'managerUsers': stats.managers,
            'regularUsers': stats.users
        };

        Object.keys(statsElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = statsElements[id];
            }
        });

        console.log('📊 Estatísticas atualizadas:', stats);
    }

    showCreateUserModal() {
        this.showUserModal();
    }

    showUserModal(user = null) {
        // Criar modal simples para demo
        const isEdit = !!user;
        const title = isEdit ? 'Editar Usuário' : 'Criar Novo Usuário';
        
        const name = user ? user.name : prompt('Nome do usuário:');
        if (!name) return;
        
        const email = user ? user.email : prompt('Email do usuário:');
        if (!email) return;
        
        const role = user ? user.role : prompt('Role (admin/manager/user):', 'user');
        if (!role) return;
        
        const department = user ? user.department : prompt('Departamento (opcional):');
        const phone = user ? user.phone : prompt('Telefone (opcional):');
        
        const userData = { name, email, role };
        if (department) userData.department = department;
        if (phone) userData.phone = phone;
        
        if (!isEdit) {
            userData.password = prompt('Senha (deixe vazio para senha padrão):') || 'senha123';
        }
        
        this.saveUser(userData, isEdit ? user.id : null);
    }

    async saveUser(userData, userId = null) {
        try {
            this.showLoader();

            let response;
            if (userId) {
                console.log('📝 Atualizando usuário:', userId);
                response = await window.salaLivreAPI.updateUser(userId, userData);
            } else {
                console.log('➕ Criando novo usuário');
                response = await window.salaLivreAPI.createUser(userData);
            }

            if (response.success) {
                this.showSuccess(response.message);
                await this.loadUsers();
                
                // Notificar sistema
                if (window.notificationSystem) {
                    window.notificationSystem.notifyUserAdded(response.data);
                }
            } else {
                this.showError(response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar usuário:', error);
            this.showError('Erro ao salvar usuário: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    async editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.showUserModal(user);
        }
    }

    async toggleUserStatus(id, active) {
        try {
            this.showLoader();
            
            console.log(`🔄 ${active ? 'Ativando' : 'Desativando'} usuário:`, id);
            const response = await window.salaLivreAPI.updateUser(id, { active });
            
            if (response.success) {
                this.showSuccess(response.message);
                await this.loadUsers();
            } else {
                this.showError(response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao alterar status:', error);
            this.showError('Erro ao alterar status: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    confirmDeleteUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            this.deleteUser(id);
        }
    }

    async deleteUser(id) {
        try {
            this.showLoader();
            
            console.log('🗑️ Excluindo usuário:', id);
            const response = await window.salaLivreAPI.deleteUser(id);
            
            if (response.success) {
                this.showSuccess(response.message);
                await this.loadUsers();
            } else {
                this.showError(response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao excluir usuário:', error);
            this.showError('Erro ao excluir usuário: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    async resetPassword(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        if (user.auth_provider === 'google') {
            alert('Usuários Google não podem ter senha redefinida no sistema local.');
            return;
        }

        const newPassword = prompt(`Digite a nova senha para ${user.name}:`);
        if (!newPassword || newPassword.length < 6) {
            alert('Senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            this.showLoader();
            
            console.log('🔑 Redefinindo senha para usuário:', id);
            const response = await window.salaLivreAPI.changePassword(id, {
                newPassword: newPassword
            });
            
            if (response.success) {
                this.showSuccess('Senha alterada com sucesso!');
            } else {
                this.showError(response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao redefinir senha:', error);
            this.showError('Erro ao redefinir senha: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    // Métodos de filtro
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('[data-user-id]');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    filterUsersByRole(role) {
        const rows = document.querySelectorAll('[data-user-id]');
        
        rows.forEach(row => {
            if (!role) {
                row.style.display = '';
                return;
            }
            
            const roleElement = row.querySelector('.role-badge');
            const userRole = roleElement ? roleElement.classList[1]?.replace('role-', '') : '';
            row.style.display = userRole === role ? '' : 'none';
        });
    }

    // Métodos utilitários
    getRoleLabel(role) {
        const roles = {
            'admin': 'Administrador',
            'manager': 'Gerente',
            'user': 'Usuário'
        };
        return roles[role] || role;
    }

    getUserIcon(role) {
        const icons = {
            'admin': 'fa-crown',
            'manager': 'fa-user-tie',
            'user': 'fa-user'
        };
        return icons[role] || 'fa-user';
    }

    // Métodos de UI
    showAdminElements() {
        const adminElements = document.querySelectorAll('.admin-only, [data-admin-only]');
        adminElements.forEach(el => el.style.display = '');
    }

    hideAdminElements() {
        const adminElements = document.querySelectorAll('.admin-only, [data-admin-only]');
        adminElements.forEach(el => el.style.display = 'none');
    }

    showLoader() {
        const loader = document.getElementById('usersLoader');
        if (loader) loader.style.display = 'block';
    }

    hideLoader() {
        const loader = document.getElementById('usersLoader');
        if (loader) loader.style.display = 'none';
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Usar sistema de notificações se disponível
        if (window.notificationSystem) {
            window.notificationSystem.addNotification(type, 'Gerenciamento de Usuários', message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            if (type === 'error') {
                alert('Erro: ' + message);
            }
        }
    }

    setupUserModal() {
        // Configuração adicional de modal pode ser feita aqui
        console.log('🎯 Modal de usuário configurado');
    }
}

// ==================== INICIALIZAÇÃO ====================
let userManagementAPI;

document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que a API esteja carregada
    setTimeout(() => {
        userManagementAPI = new UserManagementAPI();
        window.userManagementAPI = userManagementAPI;
        console.log('👥 Sistema de Gerenciamento de Usuários com API carregado!');
    }, 1500);
});

console.log('📋 Módulo de Gerenciamento de Usuários com API carregado!');
