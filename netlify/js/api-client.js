// ==================== API CLIENT PARA SALA LIVRE ====================

class SalaLivreAPI {
    constructor() {
        // Aguardar configuração estar disponível
        this.waitForConfig().then(() => {
            this.baseURL = this.getBaseURL();
            console.log('🌐 API Client configurado para:', this.baseURL);
        });
        
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
    }

    async waitForConfig() {
        // Aguardar window.SALALIVRE_CONFIG estar disponível
        while (!window.SALALIVRE_CONFIG) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Determinar URL base da API baseado na configuração
    getBaseURL() {
        if (window.SALALIVRE_CONFIG) {
            return window.SALALIVRE_CONFIG.apiBaseURL;
        }
        
        // Fallback caso config não esteja carregada
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else if (hostname.includes('netlify.app')) {
            // ATENÇÃO: Precisa configurar servidor backend real
            console.warn('⚠️ CONFIGURE O SERVIDOR BACKEND PARA PRODUÇÃO!');
            return 'https://SEU-SERVIDOR-BACKEND.com/api';
        } else {
            return '/api';
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            
            // Se token inválido, redirecionar para login
            if (error.message.includes('Token inválido') || error.message.includes('Token de acesso requerido')) {
                this.logout();
                window.location.href = '/login';
            }
            
            throw error;
        }
    }

    // ==================== AUTENTICAÇÃO ====================
    
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success) {
            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.user));
        }
        
        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success && response.token) {
            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.user));
        }
        
        return response;
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    isAuthenticated() {
        return !!this.token;
    }

    isAdmin() {
        return this.user?.role === 'admin';
    }

    getCurrentUser() {
        return this.user;
    }

    // ==================== USUÁRIOS ====================
    
    async getUsers() {
        return await this.request('/users');
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    async changePassword(id, passwordData) {
        return await this.request(`/users/${id}/password`, {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // ==================== SALAS ====================
    
    async getRooms() {
        return await this.request('/rooms');
    }

    async getRoom(id) {
        return await this.request(`/rooms/${id}`);
    }

    async createRoom(roomData) {
        return await this.request('/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData)
        });
    }

    async updateRoom(id, roomData) {
        return await this.request(`/rooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(roomData)
        });
    }

    async deleteRoom(id) {
        return await this.request(`/rooms/${id}`, {
            method: 'DELETE'
        });
    }

    async getRoomStats(id) {
        return await this.request(`/rooms/${id}/stats`);
    }

    // ==================== RESERVAS ====================
    
    async getBookings(filters = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                params.append(key, filters[key]);
            }
        });
        
        const query = params.toString();
        const endpoint = query ? `/bookings?${query}` : '/bookings';
        
        return await this.request(endpoint);
    }

    async getBooking(id) {
        return await this.request(`/bookings/${id}`);
    }

    async createBooking(bookingData) {
        return await this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async updateBooking(id, bookingData) {
        return await this.request(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData)
        });
    }

    async cancelBooking(id) {
        return await this.request(`/bookings/${id}`, {
            method: 'DELETE'
        });
    }

    async getBookingStats() {
        return await this.request('/bookings/stats/overview');
    }

    // ==================== MÉTODOS ESPECÍFICOS PARA O CALENDAR ====================
    
    async getCalendarEvents(start, end) {
        const filters = {
            start_date: start,
            end_date: end,
            status: 'confirmed'
        };
        
        const response = await this.getBookings(filters);
        
        if (response.success) {
            // Converter para formato do FullCalendar
            return response.data.map(booking => ({
                id: booking.id,
                title: booking.title,
                start: booking.start_time,
                end: booking.end_time,
                allDay: booking.all_day,
                backgroundColor: booking.room_color || '#22c55e',
                borderColor: booking.room_color || '#22c55e',
                extendedProps: {
                    description: booking.description,
                    room_id: booking.room_id,
                    room_name: booking.room_name,
                    user_id: booking.user_id,
                    user_name: booking.user_name,
                    user_email: booking.user_email,
                    attendees: booking.attendees,
                    priority: booking.priority,
                    notes: booking.notes,
                    status: booking.status,
                    recurring: booking.recurring
                }
            }));
        }
        
        return [];
    }

    async saveCalendarEvent(eventData) {
        const bookingData = {
            title: eventData.title,
            description: eventData.description || '',
            room_id: eventData.room_id,
            start_time: eventData.start,
            end_time: eventData.end,
            all_day: eventData.allDay || false,
            attendees: eventData.attendees || [],
            priority: eventData.priority || 'medium',
            notes: eventData.notes || ''
        };
        
        if (eventData.id) {
            // Atualizar evento existente
            return await this.updateBooking(eventData.id, bookingData);
        } else {
            // Criar novo evento
            return await this.createBooking(bookingData);
        }
    }

    // ==================== UTILITÁRIOS ====================
    
    formatDate(date) {
        return new Date(date).toISOString();
    }

    formatDisplayDate(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ==================== SINCRONIZAÇÃO ====================
    
    async syncData() {
        try {
            console.log('🔄 Sincronizando dados...');
            
            // Buscar dados mais recentes
            const [rooms, bookings] = await Promise.all([
                this.getRooms(),
                this.getBookings()
            ]);
            
            // Atualizar cache local se necessário
            if (rooms.success) {
                localStorage.setItem('cached_rooms', JSON.stringify(rooms.data));
            }
            
            if (bookings.success) {
                localStorage.setItem('cached_bookings', JSON.stringify(bookings.data));
            }
            
            console.log('✅ Sincronização concluída');
            return true;
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return false;
        }
    }

    // Cache offline
    getCachedRooms() {
        return JSON.parse(localStorage.getItem('cached_rooms') || '[]');
    }

    getCachedBookings() {
        return JSON.parse(localStorage.getItem('cached_bookings') || '[]');
    }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.salaLivreAPI = new SalaLivreAPI();

// ==================== AUTO SINCRONIZAÇÃO ====================
// Sincronizar dados a cada 30 segundos
setInterval(() => {
    if (window.salaLivreAPI.isAuthenticated()) {
        window.salaLivreAPI.syncData();
    }
}, 30000);

// Sincronizar quando a página ficar visível novamente
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.salaLivreAPI.isAuthenticated()) {
        window.salaLivreAPI.syncData();
    }
});

console.log('🚀 API Cliente Sala Livre carregado!');
