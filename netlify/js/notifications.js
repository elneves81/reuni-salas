// ==================== SISTEMA DE NOTIFICAÇÕES ====================

class NotificationSystem {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('salalivre_notifications') || '[]');
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.createNotificationPanel();
        this.updateNotificationBadge();
        this.setupEventListeners();
        this.requestPermission();
    }

    createNotificationPanel() {
        console.log('🏗️ Criando painel de notificações...');
        
        // Remover painel existente se houver
        const existingPanel = document.getElementById('notificationPanel');
        if (existingPanel) {
            console.log('🗑️ Removendo painel existente');
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h3>
                    <i class="fas fa-bell"></i>
                    Notificações
                </h3>
                <div class="notification-actions">
                    <button class="mark-all-read" onclick="notificationSystem.markAllAsRead()">
                        <i class="fas fa-check-double"></i>
                        Marcar todas como lidas
                    </button>
                    <button class="close-panel" onclick="notificationSystem.togglePanel()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="notification-filters">
                <button class="filter-btn active" data-filter="all">Todas</button>
                <button class="filter-btn" data-filter="booking">Reservas</button>
                <button class="filter-btn" data-filter="system">Sistema</button>
                <button class="filter-btn" data-filter="user">Usuários</button>
            </div>
            <div class="notification-list" id="notificationList">
                <!-- Notifications will be populated here -->
            </div>
        `;
        
        // Anexar ao body
        document.body.appendChild(panel);
        console.log('✅ Painel criado e anexado ao body');
        
        // Verificar se foi criado corretamente
        const createdPanel = document.getElementById('notificationPanel');
        console.log('🔍 Painel verificado:', !!createdPanel);
        
        return panel;
    }

    setupEventListeners() {
        // Aguardar um pouco para garantir que o DOM está completamente carregado
        console.log('🔧 Configurando event listeners...');
        
        const setupButton = () => {
            const notificationBtn = document.getElementById('notificationsBtn');
            console.log('🔔 Tentando encontrar botão:', notificationBtn);
            
            if (notificationBtn) {
                // Remover listeners existentes para evitar duplicatas
                const newBtn = notificationBtn.cloneNode(true);
                notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔔 CLIQUE NO SINO DETECTADO!');
                    console.log('🔔 Event target:', e.target);
                    console.log('🔔 notificationSystem:', this);
                    this.togglePanel();
                });
                
                // Adicionar visual feedback
                newBtn.addEventListener('mouseenter', () => {
                    newBtn.style.transform = 'scale(1.1)';
                });
                
                newBtn.addEventListener('mouseleave', () => {
                    newBtn.style.transform = 'scale(1.0)';
                });
                
                console.log('✅ Event listener configurado com sucesso!');
                return true;
            } else {
                console.error('❌ Botão de notificações não encontrado!');
                return false;
            }
        };

        // Tentar configurar imediatamente
        if (!setupButton()) {
            // Se não conseguir, tentar novamente após um delay
            setTimeout(() => {
                console.log('🔄 Tentativa 2 de configurar botão...');
                if (!setupButton()) {
                    // Última tentativa
                    setTimeout(() => {
                        console.log('🔄 Tentativa 3 de configurar botão...');
                        setupButton();
                    }, 1000);
                }
            }, 500);
        }

        // Configurar filtros quando o painel for criado
        setTimeout(() => {
            // Filtros de notificação
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    this.filterNotifications(e.target.dataset.filter);
                }
            });
        }, 100);
    }

    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    addNotification(type, title, message, data = {}) {
        const notification = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            read: false,
            icon: this.getIconForType(type)
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();

        // Mostrar notificação do browser se permitido
        this.showBrowserNotification(notification);

        return notification;
    }

    getIconForType(type) {
        const icons = {
            'booking': 'fa-calendar-check',
            'system': 'fa-cog',
            'user': 'fa-user',
            'warning': 'fa-exclamation-triangle',
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: notification.id
            });

            browserNotification.onclick = () => {
                window.focus();
                this.markAsRead(notification.id);
                browserNotification.close();
            };

            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    }

    togglePanel() {
        console.log('🔔 Tentando abrir/fechar painel de notificações');
        
        let panel = document.getElementById('notificationPanel');
        
        // Se o painel não existe, criar novamente
        if (!panel) {
            console.log('📋 Painel não encontrado, criando...');
            this.createNotificationPanel();
            panel = document.getElementById('notificationPanel');
        }
        
        if (!panel) {
            console.error('❌ Erro: Não foi possível criar o painel');
            return;
        }
        
        const isOpen = panel.classList.contains('open');
        console.log('📋 Painel status atual:', isOpen ? 'Aberto' : 'Fechado');
        
        if (isOpen) {
            panel.classList.remove('open');
            console.log('📋 Painel fechado');
        } else {
            panel.classList.add('open');
            this.renderNotifications();
            console.log('📋 Painel aberto');
        }
    }

    renderNotifications(filter = 'all') {
        const list = document.getElementById('notificationList');
        let filteredNotifications = this.notifications;

        if (filter !== 'all') {
            filteredNotifications = this.notifications.filter(n => n.type === filter);
        }

        if (filteredNotifications.length === 0) {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>Nenhuma notificação encontrada</p>
                </div>
            `;
            return;
        }

        list.innerHTML = filteredNotifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTimestamp(notification.timestamp)}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button class="mark-read-btn" onclick="notificationSystem.markAsRead(${notification.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="delete-btn" onclick="notificationSystem.deleteNotification(${notification.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterNotifications(filter) {
        this.renderNotifications(filter);
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();
    }

    updateNotificationBadge() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }

    saveNotifications() {
        // Manter apenas as últimas 50 notificações
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        localStorage.setItem('salalivre_notifications', JSON.stringify(this.notifications));
    }

    // Métodos públicos para adicionar notificações específicas
    notifyNewBooking(bookingData) {
        this.addNotification(
            'booking',
            'Nova Reserva Criada',
            `Reserva "${bookingData.title}" criada para ${bookingData.date}`,
            bookingData
        );
    }

    notifyBookingCancelled(bookingData) {
        this.addNotification(
            'booking',
            'Reserva Cancelada',
            `Reserva "${bookingData.title}" foi cancelada`,
            bookingData
        );
    }

    notifyUserAdded(userData) {
        this.addNotification(
            'user',
            'Novo Usuário',
            `Usuário ${userData.name} foi adicionado ao sistema`,
            userData
        );
    }

    notifySystemUpdate(message) {
        this.addNotification(
            'system',
            'Atualização do Sistema',
            message
        );
    }
}

// Inicializar sistema de notificações
let notificationSystem;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de notificações...');
    notificationSystem = new NotificationSystem();
    
    // Função de debug para teste manual
    window.testNotifications = function() {
        console.log('🧪 === TESTE COMPLETO DO SISTEMA ===');
        console.log('📋 notificationSystem existe:', !!notificationSystem);
        
        const btn = document.getElementById('notificationsBtn');
        console.log('🔔 Botão encontrado:', !!btn);
        console.log('🔔 Botão elemento:', btn);
        
        if (btn) {
            console.log('🔔 Botão classes:', btn.classList.toString());
            console.log('🔔 Botão parent:', btn.parentElement);
        }
        
        const panel = document.getElementById('notificationPanel');
        console.log('📋 Painel existe:', !!panel);
        
        if (notificationSystem) {
            console.log('🔧 Chamando togglePanel...');
            notificationSystem.togglePanel();
        }
        
        return {
            system: !!notificationSystem,
            button: !!btn,
            panel: !!panel
        };
    };
    
    // Função para forçar clique no botão
    window.clickNotificationButton = function() {
        const btn = document.getElementById('notificationsBtn');
        if (btn) {
            console.log('🖱️ Simulando clique no botão...');
            btn.click();
        } else {
            console.error('❌ Botão não encontrado para clique!');
        }
    };
    
    // Adicionar algumas notificações de exemplo
    setTimeout(() => {
        console.log('📨 Adicionando notificações de exemplo...');
        if (notificationSystem) {
            notificationSystem.notifySystemUpdate('Sistema atualizado com sucesso!');
            notificationSystem.addNotification('info', 'Bem-vindo!', 'Sistema Sala Livre carregado com sucesso');
            
            // Teste automático após 3 segundos
            setTimeout(() => {
                console.log('🤖 Executando teste automático...');
                window.testNotifications();
            }, 3000);
        }
    }, 2000);
    
    console.log('✅ Sistema de notificações inicializado');
});

// Função global para debugging
window.debugNotifications = function() {
    console.log('🐛 === DEBUG DETALHADO ===');
    console.log('📱 Usuário:', navigator.userAgent);
    console.log('📋 DOM carregado:', document.readyState);
    console.log('🔔 Botão HTML:', document.getElementById('notificationsBtn')?.outerHTML);
    console.log('📋 Painel HTML:', document.getElementById('notificationPanel')?.outerHTML || 'Não existe');
    console.log('🌐 notificationSystem global:', window.notificationSystem);
    
    // Tentar recriar o event listener
    if (window.notificationSystem) {
        console.log('🔧 Recriando event listeners...');
        window.notificationSystem.setupEventListeners();
    }
};
