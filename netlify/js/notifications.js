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
        document.body.appendChild(panel);
    }

    setupEventListeners() {
        // Botão de notificações no header
        const notificationBtn = document.getElementById('notificationsBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.togglePanel());
        }

        // Filtros de notificação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.filterNotifications(e.target.dataset.filter);
            }
        });
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
        const panel = document.getElementById('notificationPanel');
        panel.classList.toggle('open');
        
        if (panel.classList.contains('open')) {
            this.renderNotifications();
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
    notificationSystem = new NotificationSystem();
    
    // Adicionar algumas notificações de exemplo
    setTimeout(() => {
        notificationSystem.notifySystemUpdate('Sistema atualizado com sucesso!');
        notificationSystem.addNotification('info', 'Bem-vindo!', 'Sistema Sala Livre carregado com sucesso');
    }, 2000);
});
