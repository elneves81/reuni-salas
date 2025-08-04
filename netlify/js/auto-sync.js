// ==================== SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA ====================

class AutoSyncSystem {
    constructor() {
        this.syncInterval = null;
        this.lastSync = null;
        this.syncIntervalTime = 10000; // 10 segundos
        this.isEnabled = true;
        this.listeners = [];
    }

    // Iniciar sincronização automática
    start() {
        if (!this.isEnabled) return;
        
        console.log('🔄 Iniciando sincronização automática...');
        
        // Primeira sincronização imediata
        this.syncNow();
        
        // Configurar intervalo de sincronização
        this.syncInterval = setInterval(() => {
            this.syncNow();
        }, this.syncIntervalTime);
        
        // Escutar mudanças de foco da janela para sincronizar quando voltar
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Página voltou ao foco - sincronizando...');
                this.syncNow();
            }
        });
    }

    // Parar sincronização
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ Sincronização automática parada');
        }
    }

    // Sincronização manual imediata
    async syncNow() {
        if (!this.isEnabled) return;
        
        try {
            console.log('🔄 Sincronizando dados...');
            
            // 1. Sincronizar reuniões
            await this.syncBookings();
            
            // 2. Sincronizar salas (se houver mudanças)
            await this.syncRooms();
            
            // 3. Atualizar timestamp da última sincronização
            this.lastSync = new Date();
            
            // 4. Notificar listeners
            this.notifyListeners('sync-complete');
            
            console.log('✅ Sincronização concluída:', this.lastSync.toLocaleTimeString());
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            this.notifyListeners('sync-error', error);
        }
    }

    // Sincronizar reuniões
    async syncBookings() {
        if (!window.apiClient) return;
        
        try {
            // Buscar todas as reuniões do servidor
            const reunioes = await window.apiClient.get('/bookings');
            
            // Atualizar calendário se existir
            if (window.calendar) {
                // Remover eventos existentes
                const eventosAtuais = window.calendar.getEvents();
                eventosAtuais.forEach(event => event.remove());
                
                // Adicionar eventos atualizados
                reunioes.forEach(reuniao => {
                    const evento = this.formatBookingForCalendar(reuniao);
                    window.calendar.addEvent(evento);
                });
                
                console.log(`📅 ${reunioes.length} reuniões sincronizadas no calendário`);
            }
            
            // Salvar no localStorage para backup
            localStorage.setItem('cachedBookings', JSON.stringify(reunioes));
            
        } catch (error) {
            console.error('❌ Erro ao sincronizar reuniões:', error);
            
            // Tentar carregar do cache em caso de erro
            this.loadFromCache();
        }
    }

    // Sincronizar salas
    async syncRooms() {
        if (!window.apiClient) return;
        
        try {
            const salas = await window.apiClient.get('/rooms');
            
            // Atualizar cache de salas
            localStorage.setItem('cachedRooms', JSON.stringify(salas));
            
            // Atualizar dropdowns de salas se existirem
            this.updateRoomSelects(salas);
            
        } catch (error) {
            console.error('❌ Erro ao sincronizar salas:', error);
        }
    }

    // Formatar reunião para o calendário
    formatBookingForCalendar(reuniao) {
        return {
            id: reuniao.id,
            title: reuniao.title || reuniao.subject,
            start: reuniao.start_time,
            end: reuniao.end_time,
            backgroundColor: this.getEventColor(reuniao.status),
            borderColor: this.getEventColor(reuniao.status),
            extendedProps: {
                room_id: reuniao.room_id,
                room_name: reuniao.room_name,
                organizer: reuniao.organizer_name,
                participants: reuniao.participants,
                description: reuniao.description,
                equipment: reuniao.equipment,
                status: reuniao.status
            }
        };
    }

    // Cores dos eventos baseado no status
    getEventColor(status) {
        const colors = {
            'confirmed': '#28a745',   // Verde
            'pending': '#ffc107',     // Amarelo
            'cancelled': '#dc3545',   // Vermelho
            'completed': '#6c757d'    // Cinza
        };
        return colors[status] || '#007bff'; // Azul padrão
    }

    // Atualizar selects de salas
    updateRoomSelects(salas) {
        const selects = document.querySelectorAll('select[name="room"], select[name="room_id"]');
        selects.forEach(select => {
            // Salvar valor atual
            const currentValue = select.value;
            
            // Limpar opções
            select.innerHTML = '<option value="">Selecione uma sala</option>';
            
            // Adicionar salas
            salas.forEach(sala => {
                const option = document.createElement('option');
                option.value = sala.id;
                option.textContent = `${sala.name} (Cap: ${sala.capacity})`;
                select.appendChild(option);
            });
            
            // Restaurar valor se ainda existir
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    // Carregar do cache em caso de erro
    loadFromCache() {
        try {
            const cachedBookings = localStorage.getItem('cachedBookings');
            if (cachedBookings && window.calendar) {
                const reunioes = JSON.parse(cachedBookings);
                
                // Limpar calendário
                const eventosAtuais = window.calendar.getEvents();
                eventosAtuais.forEach(event => event.remove());
                
                // Carregar do cache
                reunioes.forEach(reuniao => {
                    const evento = this.formatBookingForCalendar(reuniao);
                    window.calendar.addEvent(evento);
                });
                
                console.log('📦 Dados carregados do cache local');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cache:', error);
        }
    }

    // Adicionar listener para eventos de sincronização
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Notificar listeners
    notifyListeners(event, data = null) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('❌ Erro no listener de sincronização:', error);
            }
        });
    }

    // Forçar sincronização após criar/editar/deletar
    async syncAfterChange(type, data) {
        console.log(`🔄 Sincronização forçada após ${type}:`, data);
        
        // Aguardar um pouco para o servidor processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sincronizar imediatamente
        await this.syncNow();
        
        // Mostrar notificação
        if (window.notificationSystem) {
            window.notificationSystem.addNotification(
                'success', 
                'Sincronizado', 
                `${type.charAt(0).toUpperCase() + type.slice(1)} sincronizada com todos os usuários!`
            );
        }
    }

    // Configurar intervalo de sincronização
    setInterval(seconds) {
        this.syncIntervalTime = seconds * 1000;
        
        // Reiniciar se já estiver rodando
        if (this.syncInterval) {
            this.stop();
            this.start();
        }
    }

    // Status da sincronização
    getStatus() {
        return {
            isRunning: !!this.syncInterval,
            lastSync: this.lastSync,
            interval: this.syncIntervalTime / 1000,
            isEnabled: this.isEnabled
        };
    }
}

// Criar instância global
window.autoSync = new AutoSyncSystem();

// Iniciar automaticamente quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar outros scripts carregarem
    setTimeout(() => {
        if (window.apiClient) {
            window.autoSync.start();
        }
    }, 2000);
});

console.log('🔄 Sistema de sincronização automática carregado!');
