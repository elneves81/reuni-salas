// ==================== SISTEMA DE GERENCIAMENTO DE USUÁRIOS - BANCO DE DADOS ====================

class UserManagementSystem {
    constructor() {
        this.users = [];
        this.currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
        this.apiClient = window.apiClient;
        this.init();
    }

    async init() {
        try {
            await this.loadUsersFromDB();
            await this.initializeDefaultUsers();
            this.updateUserPermissions();
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de usuários:', error);
            // Fallback para localStorage em caso de erro
            this.users = JSON.parse(localStorage.getItem('salalivre_users') || '[]');
        }
    }

    // Carregar usuários do banco de dados
    async loadUsersFromDB() {
        try {
            if (!this.apiClient) {
                throw new Error('API Client não disponível');
            }
            
            const response = await this.apiClient.getUsers();
            this.users = response || [];
            console.log('✅ Usuários carregados do banco:', this.users.length);
            return this.users;
        } catch (error) {
            console.error('❌ Erro ao carregar usuários do banco:', error);
            throw error;
        }
    }

    async initializeDefaultUsers() {
        // Se não há usuários no banco, criar usuário admin padrão
        if (this.users.length === 0) {
            try {
                const adminUser = {
                    name: 'Administrador',
                    email: 'admin@salalivre.com',
                    password: 'admin123',
                    role: 'admin',
                    department: 'ti',
                    status: 'active'
                };
                
                const createdUser = await this.apiClient.createUser(adminUser);
                this.users.push(createdUser);
                console.log('👑 Usuário admin padrão criado no banco');
            } catch (error) {
                console.error('❌ Erro ao criar usuário admin:', error);
            }
        }
    }

    // Verificar se o usuário atual é admin
    isCurrentUserAdmin() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'administrator');
    }

    // Verificar permissão específica
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Admin sempre tem todas as permissões
        if (this.isCurrentUserAdmin()) return true;
        
        const userRecord = this.users.find(u => u.email === this.currentUser.email);
        return userRecord?.permissions?.[permission] || false;
    }

    // Criar novo usuário (apenas admin) - SALVANDO NO BANCO
    async createUser(userData) {
        if (!this.isCurrentUserAdmin()) {
            throw new Error('❌ Apenas administradores podem criar usuários');
        }

        try {
            const newUser = await this.apiClient.createUser(userData);
            this.users.push(newUser);
            
            // Notificar
            if (window.notificationSystem) {
                window.notificationSystem.notifyUserAdded(newUser);
            }

            console.log('✅ Usuário criado no banco:', newUser.name);
            return newUser;
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
            throw new Error(error.message || 'Erro ao criar usuário');
        }
    }

    // Editar usuário (apenas admin) - ATUALIZANDO NO BANCO
    async editUser(userId, updates) {
        if (!this.isCurrentUserAdmin()) {
            throw new Error('❌ Apenas administradores podem editar usuários');
        }

        try {
            const updatedUser = await this.apiClient.updateUser(userId, updates);
            
            // Atualizar na lista local
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users[userIndex] = updatedUser;
            }

            console.log('✅ Usuário editado no banco:', updatedUser.name);
            return updatedUser;
        } catch (error) {
            console.error('❌ Erro ao editar usuário:', error);
            throw new Error(error.message || 'Erro ao editar usuário');
        }
    }

    // Excluir usuário (apenas admin) - REMOVENDO DO BANCO
    async deleteUser(userId) {
        if (!this.isCurrentUserAdmin()) {
            throw new Error('❌ Apenas administradores podem excluir usuários');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('❌ Usuário não encontrado');
        }

        // Não permitir excluir o próprio usuário
        if (user.email === this.currentUser.email) {
            throw new Error('❌ Você não pode excluir seu próprio usuário');
        }

        try {
            await this.apiClient.deleteUser(userId);
            
            // Remover da lista local
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users.splice(userIndex, 1);
            }

            console.log('✅ Usuário excluído do banco:', user.name);
            return user;
        } catch (error) {
            console.error('❌ Erro ao excluir usuário:', error);
            throw new Error(error.message || 'Erro ao excluir usuário');
        }
    }

    // Obter permissões padrão por role
    getDefaultPermissions(role) {
        const permissions = {
            admin: {
                manageUsers: true,
                manageRooms: true,
                manageBookings: true,
                viewReports: true,
                systemSettings: true
            },
            manager: {
                manageUsers: false,
                manageRooms: true,
                manageBookings: true,
                viewReports: true,
                systemSettings: false
            },
            user: {
                manageUsers: false,
                manageRooms: false,
                manageBookings: true,
                viewReports: false,
                systemSettings: false
            }
        };

        return permissions[role] || permissions.user;
    }

    // Hash simples para senhas (em produção, usar bcrypt)
    hashPassword(password) {
        // Implementação simples - em produção usar biblioteca adequada
        return btoa(password + 'sala_livre_salt');
    }

    // Verificar senha
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Atualizar permissões na interface
    updateUserPermissions() {
        const isAdmin = this.isCurrentUserAdmin();
        
        // Mostrar/esconder elementos baseado em permissões
        const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
        adminOnlyElements.forEach(element => {
            element.style.display = isAdmin ? 'block' : 'none';
        });

        // Atualizar botões de usuário
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }

        // Mostrar role do usuário atual
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) {
            userRoleEl.textContent = this.getRoleDisplayName(this.currentUser.role);
            userRoleEl.className = `user-role role-${this.currentUser.role}`;
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': 'Administrador',
            'administrator': 'Administrador',
            'manager': 'Gerente',
            'user': 'Usuário'
        };
        return roles[role] || 'Usuário';
    }

    // Buscar usuários com filtros - DIRETO DO BANCO
    async getUsers(filters = {}) {
        try {
            // Recarregar usuários do banco sempre que buscar
            await this.loadUsersFromDB();
            
            let filteredUsers = [...this.users];

            if (filters.role) {
                filteredUsers = filteredUsers.filter(u => u.role === filters.role);
            }

            if (filters.department) {
                filteredUsers = filteredUsers.filter(u => u.department === filters.department);
            }

            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredUsers = filteredUsers.filter(u => 
                    u.name.toLowerCase().includes(search) || 
                    u.email.toLowerCase().includes(search)
                );
            }

            return filteredUsers;
        } catch (error) {
            console.error('❌ Erro ao buscar usuários:', error);
            // Fallback para lista local
            return this.users.filter(u => {
                if (filters.role && u.role !== filters.role) return false;
                if (filters.department && u.department !== filters.department) return false;
                if (filters.search) {
                    const search = filters.search.toLowerCase();
                    return u.name.toLowerCase().includes(search) || 
                           u.email.toLowerCase().includes(search);
                }
                return true;
            });
        }
    }

    // Buscar usuário específico por ID - DIRETO DO BANCO
    async getUserById(userId) {
        try {
            const user = await this.apiClient.getUser(userId);
            return user;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            // Fallback para lista local
            return this.users.find(u => u.id === userId);
        }
    }

    // Sincronizar com banco (atualizar cache local)
    async syncWithDatabase() {
        try {
            await this.loadUsersFromDB();
            console.log('✅ Sincronização com banco realizada');
            return true;
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return false;
        }
    }

    // Métodos para integração com interface - DADOS DO BANCO
    renderUserCard(user) {
        const isAdmin = this.isCurrentUserAdmin();
        const canEdit = isAdmin && user.email !== this.currentUser.email; // Admin pode editar outros
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-card-header">
                    <div class="user-card-avatar ${user.role}">
                        <i class="fas ${this.getUserIcon(user.role)}"></i>
                    </div>
                    <div class="user-card-info">
                        <h3>${user.name}</h3>
                        <span class="user-card-role role-${user.role}">${this.getRoleDisplayName(user.role)}</span>
                        <span class="user-card-status status-${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                        <small class="database-badge">💾 Banco de Dados</small>
                    </div>
                </div>
                <div class="user-card-details">
                    <div class="user-card-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${user.email}</span>
                    </div>
                    <div class="user-card-detail">
                        <i class="fas fa-building"></i>
                        <span>${this.getDepartmentDisplayName(user.department)}</span>
                    </div>
                    <div class="user-card-detail">
                        <i class="fas fa-clock"></i>
                        <span>Criado: ${new Date(user.created_at || user.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    ${user.last_access || user.lastAccess ? `
                        <div class="user-card-detail">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Último acesso: ${new Date(user.last_access || user.lastAccess).toLocaleDateString('pt-BR')}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="user-card-actions" ${!isAdmin ? 'style="display: none;"' : ''}>
                    ${canEdit ? `
                        <button class="btn-icon btn-primary" onclick="userManager.showEditUserModal('${user.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="userManager.confirmDeleteUser('${user.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon btn-info" onclick="userManager.showUserDetails('${user.id}')" title="Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-secondary" onclick="userManager.syncWithDatabase()" title="Sincronizar">
                        <i class="fas fa-sync"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Renderizar lista completa de usuários
    async renderUsersList(containerId = 'usersList') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">🔄 Carregando usuários do banco...</div>';
            
            const users = await this.getUsers();
            
            if (users.length === 0) {
                container.innerHTML = '<div class="no-users">📭 Nenhum usuário encontrado no banco</div>';
                return;
            }

            const userCardsHTML = users.map(user => this.renderUserCard(user)).join('');
            container.innerHTML = `
                <div class="users-header">
                    <h3>👥 Usuários (${users.length}) - 💾 Google Cloud SQL</h3>
                    <button class="btn-sync" onclick="userManager.syncWithDatabase()">
                        <i class="fas fa-sync"></i> Sincronizar
                    </button>
                </div>
                <div class="users-grid">
                    ${userCardsHTML}
                </div>
            `;
        } catch (error) {
            console.error('❌ Erro ao renderizar usuários:', error);
            container.innerHTML = '<div class="error">❌ Erro ao carregar usuários do banco</div>';
        }
    }

    getUserIcon(role) {
        const icons = {
            'admin': 'fa-crown',
            'administrator': 'fa-crown',
            'manager': 'fa-user-tie',
            'user': 'fa-user'
        };
        return icons[role] || 'fa-user';
    }

    getDepartmentDisplayName(department) {
        const departments = {
            'ti': 'Tecnologia',
            'rh': 'Recursos Humanos',
            'vendas': 'Vendas',
            'marketing': 'Marketing',
            'financeiro': 'Financeiro',
            'geral': 'Geral'
        };
        return departments[department] || department;
    }
}

// Inicializar sistema de usuários com banco de dados
let userManager;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Aguardar API Client estar disponível
        if (!window.apiClient) {
            console.log('⏳ Aguardando API Client...');
            await new Promise(resolve => {
                const checkApiClient = () => {
                    if (window.apiClient) {
                        resolve();
                    } else {
                        setTimeout(checkApiClient, 100);
                    }
                };
                checkApiClient();
            });
        }
        
        userManager = new UserManagementSystem();
        console.log('👤 Sistema de gerenciamento de usuários carregado com banco de dados');
        
        // Auto-sincronizar a cada 30 segundos
        setInterval(async () => {
            try {
                await userManager.syncWithDatabase();
            } catch (error) {
                console.log('🔄 Sincronização automática falhou (normal se offline)');
            }
        }, 30000);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema de usuários:', error);
    }
});
