// ==================== DASHBOARD EXECUTIVO JS ====================

// Configuração da API
const API_BASE_URL = 'https://salalivre.netlify.app/.netlify/functions';

// Variáveis globais
let currentUser = null;
let calendar = null;
let charts = {};
let isMobileDevice = false;

// ==================== MOBILE DETECTION ====================
function detectMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    
    // Detectar por User Agent
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // Detectar por tamanho de tela
    const isMobileScreen = window.innerWidth <= 768;
    
    // Detectar por touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    isMobileDevice = isMobileUA || (isMobileScreen && isTouchDevice);
    
    console.log('🔍 Detecção de dispositivo móvel:', {
        userAgent: userAgent.substring(0, 50) + '...',
        isMobileUA: isMobileUA,
        isMobileScreen: isMobileScreen,
        isTouchDevice: isTouchDevice,
        isMobileDevice: isMobileDevice,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    });
    
    return isMobileDevice;
}

function applyMobileOptimizations() {
    if (isMobileDevice) {
        console.log('📱 Aplicando otimizações para dispositivo móvel...');
        
        // Adicionar classe mobile ao body
        document.body.classList.add('mobile-device');
        
        // Aplicar configurações específicas para mobile
        applyMobileLayout();
        applyMobileCalendar();
        applyMobileModals();
        applyMobileTouchOptimizations();
        
        console.log('✅ Otimizações móveis aplicadas com sucesso!');
    } else {
        console.log('💻 Dispositivo desktop detectado - usando layout padrão');
    }
}

function applyMobileLayout() {
    // Forçar sidebar colapsada no mobile
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('mobile-collapsed');
    }
    
    // Ajustar main content para mobile
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
    }
    
    // Mostrar botão de menu mobile
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.style.display = 'block';
    }
}

function applyMobileCalendar() {
    // Configurações específicas do calendário para mobile
    if (calendar) {
        // Forçar view de mês no mobile
        calendar.changeView('dayGridMonth');
        
        // Ajustar altura do calendário
        calendar.setOption('height', 'auto');
        calendar.setOption('aspectRatio', 1.2);
    }
}

function applyMobileModals() {
    // Ajustar modais para mobile
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.add('mobile-modal');
    });
}

function applyMobileTouchOptimizations() {
    // Adicionar otimizações de toque
    document.body.style.touchAction = 'manipulation';
    
    // Prevenir zoom duplo click
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay') || createMobileOverlay();
    
    if (sidebar.classList.contains('mobile-show')) {
        sidebar.classList.remove('mobile-show');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('mobile-show');
        overlay.style.display = 'block';
    }
}

function createMobileOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: none;
    `;
    
    overlay.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('mobile-show');
        overlay.style.display = 'none';
    });
    
    document.body.appendChild(overlay);
    return overlay;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // Detectar dispositivo móvel primeiro
    detectMobileDevice();
    applyMobileOptimizations();
    
    // Inicializar dashboard
    initializeDashboard();
    
    // Listener para mudanças de orientação e redimensionamento
    window.addEventListener('resize', handleScreenChange);
    window.addEventListener('orientationchange', handleScreenChange);
});

function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard...');
    
    // Verificar autenticação
    checkAuthentication();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Aguardar API estar disponível antes de inicializar componentes que dependem dela
    waitForAPI().then(() => {
        console.log('✅ API disponível, inicializando componentes...');
        
        // Inicializar componentes
        initializeCharts();
        initializeCalendar();
        loadDashboardData();
        
        // Inicializar novas seções
        initializeBookingsSection();
        initializeUsersSection();
        initializeReportsSection();
        initializeSettingsSection();
        
        // Verificar dados do usuário
        loadUserData();
    }).catch(() => {
        console.log('⚠️ API não disponível, usando modo offline...');
        
        // Inicializar em modo offline
        initializeCharts();
        initializeCalendar();
        loadDashboardData();
        
        // Inicializar novas seções em modo limitado
        initializeBookingsSection();
        initializeUsersSection();
        initializeReportsSection();
        initializeSettingsSection();
        
        // Verificar dados do usuário
        loadUserData();
    });
    
    // Configurar sidebar (não depende da API)
    setupSidebar();
}

// Aguardar API estar disponível
function waitForAPI(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkAPI() {
            if (window.salaLivreAPI && window.salaLivreAPI.isReady) {
                resolve();
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error('API timeout'));
                return;
            }
            
            setTimeout(checkAPI, 100);
        }
        
        checkAPI();
    });
}

// ==================== AUTENTICAÇÃO ====================
function checkAuthentication() {
    // Verificar se API está disponível e usuário autenticado
    if (window.salaLivreAPI && window.salaLivreAPI.isAuthenticated()) {
        currentUser = window.salaLivreAPI.getCurrentUser();
        updateUserDisplay();
        return;
    }
    
    // Fallback para sistema antigo
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = '/index.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        updateUserDisplay();
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        logout();
    }
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name || 'Usuário';
        document.getElementById('userRole').textContent = getRoleDisplayName(currentUser.role) || 'User';
        
        // Atualizar elementos de admin
        updateAdminElements();
    }
}

function getRoleDisplayName(role) {
    const roles = {
        'admin': 'Administrador',
        'manager': 'Gerente', 
        'user': 'Usuário'
    };
    return roles[role] || role;
}

function updateAdminElements() {
    const isAdmin = window.salaLivreAPI ? window.salaLivreAPI.isAdmin() : (currentUser.role === 'admin');
    
    // Mostrar/ocultar elementos admin
    const adminElements = document.querySelectorAll('.admin-only, [data-admin-only]');
    adminElements.forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
}

function logout() {
    if (window.salaLivreAPI) {
        window.salaLivreAPI.logout();
    } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }
    window.location.href = '/index.html';
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileSidebar);
    
    // User menu
    document.getElementById('userMenuToggle').addEventListener('click', toggleUserMenu);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutLink').addEventListener('click', logout);
    
    // Quick actions
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('actionModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Calendar controls
    document.getElementById('newEventBtn').addEventListener('click', () => openModal('Nova Reserva', createBookingForm()));
    
    // Chart controls
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', handleChartPeriodChange);
    });
    
    // Room filters
    document.getElementById('roomSearch').addEventListener('input', filterRooms);
    document.getElementById('capacityFilter').addEventListener('change', filterRooms);
    document.getElementById('statusFilter').addEventListener('change', filterRooms);
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userMenuDropdown').classList.remove('show');
        }
    });
}

// ==================== NAVEGAÇÃO ====================
function handleNavigation(e) {
    e.preventDefault();
    
    const section = e.target.closest('a').dataset.section;
    if (!section) return;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    e.target.closest('.nav-item').classList.add('active');
    
    // Show section
    showSection(section);
    
    // Update page title
    updatePageTitle(section);
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section data if needed
        loadSectionData(sectionName);
    }
}

function getCurrentSection() {
    const activeSection = document.querySelector('.content-section.active');
    return activeSection ? activeSection.id.replace('-section', '') : 'dashboard';
}

function updatePageTitle(section) {
    const titles = {
        dashboard: 'Dashboard Executivo',
        calendar: 'Calendário',
        rooms: 'Gerenciamento de Salas',
        reservas: 'Gerenciamento de Reservas',
        users: 'Gerenciamento de Usuários',
        reports: 'Relatórios e Análises',
        settings: 'Configurações do Sistema'
    };
    
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
}

function loadSectionData(section) {
    switch (section) {
        case 'calendar':
            if (calendar) calendar.render();
            break;
        case 'rooms':
            loadRooms();
            break;
        case 'reservas':
            renderBookingsTable();
            break;
        case 'users':
            renderUsersGrid();
            break;
        case 'reports':
            loadReportsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// ==================== SIDEBAR ====================
function setupSidebar() {
    // Check if sidebar should be collapsed on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('collapsed');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function toggleUserMenu() {
    document.getElementById('userMenuDropdown').classList.toggle('show');
}

// ==================== DASHBOARD DATA ====================
function loadDashboardData() {
    loadKPIs();
    loadRecentActivity();
    updateCharts();
}

function loadKPIs() {
    // Simular dados - em produção, fazer chamadas para API
    const kpis = {
        availableRooms: 8,
        todayBookings: 12,
        occupancyRate: 76,
        activeUsers: 45
    };
    
    document.getElementById('availableRooms').textContent = kpis.availableRooms;
    document.getElementById('todayBookings').textContent = kpis.todayBookings;
    document.getElementById('occupancyRate').textContent = kpis.occupancyRate + '%';
    document.getElementById('activeUsers').textContent = kpis.activeUsers;
}

function loadRecentActivity() {
    const activities = [
        {
            icon: 'fa-calendar-plus',
            title: 'Nova reserva criada - Sala Alpha',
            meta: 'João Silva • há 5 minutos',
            color: 'var(--primary-color)'
        },
        {
            icon: 'fa-user-plus',
            title: 'Novo usuário cadastrado',
            meta: 'Maria Santos • há 15 minutos',
            color: 'var(--accent-color)'
        },
        {
            icon: 'fa-door-open',
            title: 'Sala Beta liberada',
            meta: 'Sistema • há 30 minutos',
            color: 'var(--primary-color)'
        },
        {
            icon: 'fa-exclamation-triangle',
            title: 'Manutenção agendada - Sala Gamma',
            meta: 'Admin • há 1 hora',
            color: 'var(--secondary-color)'
        }
    ];
    
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background-color: ${activity.color}">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-meta">${activity.meta}</div>
            </div>
        </div>
    `).join('');
}

// ==================== CHARTS ====================
function initializeCharts() {
    initializeOccupationChart();
    initializeRoomsChart();
}

function initializeOccupationChart() {
    const ctx = document.getElementById('occupationChart').getContext('2d');
    
    charts.occupation = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
            datasets: [{
                label: 'Taxa de Ocupação (%)',
                data: [15, 45, 78, 85, 92, 65, 88, 95, 82, 70, 35],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function initializeRoomsChart() {
    const ctx = document.getElementById('roomsChart').getContext('2d');
    
    charts.rooms = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sala Alpha', 'Sala Beta', 'Sala Gamma', 'Sala Delta'],
            datasets: [{
                data: [35, 28, 22, 15],
                backgroundColor: [
                    '#2563eb',
                    '#3b82f6',
                    '#60a5fa',
                    '#93c5fd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCharts() {
    // Atualizar dados dos gráficos baseado no período selecionado
    if (charts.occupation) {
        charts.occupation.update();
    }
    if (charts.rooms) {
        charts.rooms.update();
    }
}

function handleChartPeriodChange(e) {
    const period = e.target.dataset.period;
    const chartCard = e.target.closest('.chart-card');
    
    // Update active button
    chartCard.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update chart data based on period
    updateChartData(period);
}

function updateChartData(period) {
    // Simular atualização de dados do gráfico
    console.log('Atualizando gráfico para período:', period);
}

// ==================== CALENDAR ====================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: false,
        height: 'auto',
        events: loadSavedEvents(), // Carregar eventos salvos
        eventClick: function(info) {
            openModal('Detalhes da Reserva', createEventDetails(info.event));
        },
        dateClick: function(info) {
            // Quando clicar numa data específica do calendário, travar a data
            openModal('Nova Reserva', createBookingForm(info.dateStr, true));
        },
        datesSet: function(info) {
            // Atualizar o título do mês sempre que as datas mudarem
            updateCalendarTitle(info.start);
        }
    });
    
    // Renderizar o calendário
    calendar.render();
    
    // Expor o calendário globalmente para testes
    window.calendar = calendar;
    
    // Inicializar navegação do calendário
    initCalendarNavigation();
    
    // Limpar eventos expirados periodicamente
    cleanExpiredEvents();
}

function initCalendarNavigation() {
    // Botão mês anterior
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendar.prev();
    });
    
    // Botão próximo mês
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendar.next();
    });
    
    // Atualizar título inicial
    updateCalendarTitle(new Date());
}

function updateCalendarTitle(date) {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const titleElement = document.getElementById('currentMonth');
    if (titleElement) {
        titleElement.textContent = `${month} ${year}`;
    }
}

// ==================== EVENT PERSISTENCE ====================
async function saveEvent(eventData) {
    console.log('Salvando evento:', eventData);
    
    // Se API disponível, usar API
    if (window.salaLivreAPI && window.salaLivreAPI.isAuthenticated()) {
        try {
            const response = await window.salaLivreAPI.createBooking(eventData);
            if (response.success) {
                console.log('✅ Evento salvo na API:', response.data);
                
                // Notificar sistema de notificações
                if (window.notificationSystem) {
                    window.notificationSystem.addNotification('success', 'Calendário', 'Reunião agendada com sucesso!');
                }
                
                // 🔄 SINCRONIZAR COM TODOS OS USUÁRIOS
                if (window.autoSync) {
                    await window.autoSync.syncAfterChange('reunião criada', response.data);
                }
                
                return response.data;
            } else {
                console.error('❌ Erro ao salvar na API:', response.message);
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar evento:', error);
            if (window.notificationSystem) {
                window.notificationSystem.addNotification('error', 'Calendário', 'Erro ao agendar reunião: ' + error.message);
            }
            throw error;
        }
    }
    
    // Fallback para localStorage
    let savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
    
    // Adicionar timestamp de criação se não existir
    if (!eventData.createdAt) {
        eventData.createdAt = new Date().toISOString();
    }
    
    savedEvents.push(eventData);
    localStorage.setItem('salalivre_events', JSON.stringify(savedEvents));
    
    console.log('Evento salvo no localStorage. Total de eventos:', savedEvents.length);
    
    // 🔄 SINCRONIZAR MESMO NO FALLBACK
    if (window.autoSync) {
        await window.autoSync.syncAfterChange('reunião criada (local)', eventData);
    }
    
    return eventData;
}

function loadSavedEvents() {
    // Se API disponível, usar dados da API
    if (window.salaLivreAPI && window.salaLivreAPI.isAuthenticated()) {
        return window.salaLivreAPI.getCalendarEvents();
    }
    
    // Fallback para localStorage
    const savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
    console.log('Carregando eventos salvos:', savedEvents.length);
    
    // Adicionar alguns eventos padrão se não houver eventos salvos
    if (savedEvents.length === 0) {
        const defaultEvents = [
            {
                id: 'demo-1',
                title: 'Reunião Alpha - Equipe Marketing',
                start: '2025-08-01T09:00:00',
                end: '2025-08-01T10:30:00',
                backgroundColor: '#2563eb',
                borderColor: '#2563eb',
                extendedProps: {
                    room: 'Sala Alpha',
                    roomId: '1',
                    description: 'Reunião de planejamento mensal',
                    organizer: 'Demo',
                    originalTitle: 'Reunião Alpha - Equipe Marketing'
                }
            },
            {
                id: 'demo-2',
                title: 'Sala Beta - Treinamento',
                start: '2025-08-01T14:00:00',
                end: '2025-08-01T16:00:00',
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                extendedProps: {
                    room: 'Sala Beta',
                    roomId: '2',
                    description: 'Treinamento de novos colaboradores',
                    organizer: 'Demo',
                    originalTitle: 'Sala Beta - Treinamento'
                }
            }
        ];
        
        // Salvar eventos padrão
        localStorage.setItem('salalivre_events', JSON.stringify(defaultEvents));
        return defaultEvents;
    }
    
    return savedEvents;
}

function updateEvent(eventId, updatedData) {
    let savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
    
    const eventIndex = savedEvents.findIndex(event => event.id === eventId);
    if (eventIndex !== -1) {
        savedEvents[eventIndex] = { ...savedEvents[eventIndex], ...updatedData };
        localStorage.setItem('salalivre_events', JSON.stringify(savedEvents));
        console.log('Evento atualizado:', eventId);
    }
}

function deleteEvent(eventId) {
    let savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
    
    savedEvents = savedEvents.filter(event => event.id !== eventId);
    localStorage.setItem('salalivre_events', JSON.stringify(savedEvents));
    console.log('Evento removido:', eventId);
}

function cleanExpiredEvents() {
    console.log('Limpando eventos expirados...');
    
    let savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
    const now = new Date();
    
    // Manter apenas eventos que ainda não terminaram
    const activeEvents = savedEvents.filter(event => {
        const eventEnd = new Date(event.end);
        return eventEnd > now;
    });
    
    if (activeEvents.length !== savedEvents.length) {
        localStorage.setItem('salalivre_events', JSON.stringify(activeEvents));
        console.log(`Removidos ${savedEvents.length - activeEvents.length} eventos expirados`);
        
        // Recarregar calendário se eventos foram removidos
        if (calendar) {
            calendar.removeAllEvents();
            activeEvents.forEach(event => calendar.addEvent(event));
        }
    }
}

function handleViewChange(e) {
    const view = e.target.dataset.view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Change calendar view
    if (calendar) {
        const viewMap = {
            month: 'dayGridMonth',
            week: 'timeGridWeek',
            day: 'timeGridDay'
        };
        
        calendar.changeView(viewMap[view]);
    }
}

// ==================== ROOMS ====================
function loadRooms() {
    const rooms = [
        {
            id: 1,
            name: 'Sala Alpha',
            location: 'Andar 1 - Ala Norte',
            capacity: 12,
            equipment: ['Projetor', 'TV', 'Webcam'],
            status: 'available'
        },
        {
            id: 2,
            name: 'Sala Beta',
            location: 'Andar 2 - Ala Sul',
            capacity: 8,
            equipment: ['TV', 'Webcam'],
            status: 'occupied'
        },
        {
            id: 3,
            name: 'Sala Gamma',
            location: 'Andar 1 - Ala Sul',
            capacity: 20,
            equipment: ['Projetor', 'Som', 'Webcam'],
            status: 'maintenance'
        },
        {
            id: 4,
            name: 'Sala Delta',
            location: 'Andar 3 - Ala Norte',
            capacity: 6,
            equipment: ['TV'],
            status: 'available'
        }
    ];
    
    renderRooms(rooms);
}

function renderRooms(rooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    
    roomsGrid.innerHTML = rooms.map(room => `
        <div class="room-card">
            <div class="room-header">
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <p class="room-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${room.location}
                    </p>
                </div>
                <span class="room-status ${room.status}">
                    ${getStatusText(room.status)}
                </span>
            </div>
            
            <div class="room-details">
                <span>
                    <i class="fas fa-users"></i>
                    ${room.capacity} pessoas
                </span>
                <span>
                    <i class="fas fa-laptop"></i>
                    ${room.equipment.length} equipamentos
                </span>
            </div>
            
            <div class="room-actions">
                <button class="room-action-btn" onclick="viewRoom(${room.id})">
                    <i class="fas fa-eye"></i>
                    Ver
                </button>
                <button class="room-action-btn" onclick="editRoom(${room.id})">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="room-action-btn primary" onclick="bookRoom(${room.id})" 
                        ${room.status !== 'available' ? 'disabled' : ''}>
                    <i class="fas fa-calendar-plus"></i>
                    Reservar
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        available: 'Disponível',
        occupied: 'Ocupada',
        maintenance: 'Manutenção'
    };
    return statusMap[status] || status;
}

function filterRooms() {
    const search = document.getElementById('roomSearch').value.toLowerCase();
    const capacity = document.getElementById('capacityFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    // Implementar filtros
    console.log('Filtrando salas:', { search, capacity, status });
}

// ==================== QUICK ACTIONS ====================
function handleQuickAction(e) {
    const action = e.target.closest('.quick-action-btn').dataset.action;
    
    switch (action) {
        case 'new-booking':
            openModal('Nova Reserva', createBookingForm());
            break;
        case 'add-room':
            openModal('Adicionar Sala', createRoomForm());
            break;
        case 'add-user':
            openModal('Novo Usuário', createUserForm());
            break;
        case 'generate-report':
            openModal('Gerar Relatório', createReportForm());
            break;
    }
}

// ==================== MODAL FORMS ====================
function createBookingForm(date = '', lockDate = false) {
    const dateInput = lockDate 
        ? `<input type="date" id="bookingDate" name="date" value="${date}" readonly required style="background-color: #f8f9fa; cursor: not-allowed; border: 2px solid #2563eb;">`
        : `<input type="date" id="bookingDate" name="date" value="${date}" required>`;
    
    const dateLabel = lockDate 
        ? `<label for="bookingDate">Data <span style="color: #2563eb; font-size: 0.85em; font-weight: bold;">(selecionada no calendário - ${formatDateForDisplay(date)})</span></label>`
        : `<label for="bookingDate">Data</label>`;
    
    const dateHelp = lockDate 
        ? `<small style="color: #666; margin-top: 4px; display: block;">📅 Data fixada pelo calendário. Para alterar, use "Nova Reserva" no menu.</small>`
        : '';
        
    return `
        <form id="bookingForm" class="modal-form">
            <div class="form-group">
                <label for="bookingTitle">Título da Reunião</label>
                <input type="text" id="bookingTitle" name="title" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    ${dateLabel}
                    ${dateInput}
                    ${dateHelp}
                </div>
                <div class="form-group">
                    <label for="bookingRoom">Sala</label>
                    <select id="bookingRoom" name="room" required>
                        <option value="">Selecione uma sala</option>
                        <option value="1">Sala Alpha</option>
                        <option value="2">Sala Beta</option>
                        <option value="3">Sala Gamma</option>
                        <option value="4">Sala Delta</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="bookingStartTime">Início</label>
                    <input type="time" id="bookingStartTime" name="startTime" required>
                </div>
                <div class="form-group">
                    <label for="bookingEndTime">Fim</label>
                    <input type="time" id="bookingEndTime" name="endTime" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="bookingDescription">Descrição</label>
                <textarea id="bookingDescription" name="description" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Criar Reserva</button>
            </div>
        </form>
    `;
}

function createRoomForm() {
    return `
        <form id="roomForm" class="modal-form">
            <div class="form-group">
                <label for="roomName">Nome da Sala</label>
                <input type="text" id="roomName" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="roomLocation">Localização</label>
                <input type="text" id="roomLocation" name="location" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="roomCapacity">Capacidade</label>
                    <input type="number" id="roomCapacity" name="capacity" min="1" required>
                </div>
                <div class="form-group">
                    <label for="roomStatus">Status</label>
                    <select id="roomStatus" name="status" required>
                        <option value="available">Disponível</option>
                        <option value="maintenance">Manutenção</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="roomEquipment">Equipamentos</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" value="projetor"> Projetor</label>
                    <label><input type="checkbox" value="tv"> TV</label>
                    <label><input type="checkbox" value="webcam"> Webcam</label>
                    <label><input type="checkbox" value="som"> Sistema de Som</label>
                    <label><input type="checkbox" value="quadro"> Quadro Branco</label>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Adicionar Sala</button>
            </div>
        </form>
    `;
}

function createUserForm() {
    return `
        <form id="userForm" class="modal-form">
            <div class="form-group">
                <label for="userName">Nome Completo</label>
                <input type="text" id="userName" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="userEmail">E-mail</label>
                <input type="email" id="userEmail" name="email" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="userRole">Função</label>
                    <select id="userRole" name="role" required>
                        <option value="user">Usuário</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="userDepartment">Departamento</label>
                    <input type="text" id="userDepartment" name="department">
                </div>
            </div>
            
            <div class="form-group">
                <label for="userPassword">Senha Temporária</label>
                <input type="password" id="userPassword" name="password" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Criar Usuário</button>
            </div>
        </form>
    `;
}

function createReportForm() {
    return `
        <form id="reportForm" class="modal-form">
            <div class="form-group">
                <label for="reportType">Tipo de Relatório</label>
                <select id="reportType" name="type" required>
                    <option value="">Selecione o tipo</option>
                    <option value="occupancy">Taxa de Ocupação</option>
                    <option value="usage">Uso por Sala</option>
                    <option value="users">Atividade dos Usuários</option>
                    <option value="revenue">Relatório Financeiro</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="reportStartDate">Data Inicial</label>
                    <input type="date" id="reportStartDate" name="startDate" required>
                </div>
                <div class="form-group">
                    <label for="reportEndDate">Data Final</label>
                    <input type="date" id="reportEndDate" name="endDate" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="reportFormat">Formato</label>
                <select id="reportFormat" name="format" required>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Gerar Relatório</button>
            </div>
        </form>
    `;
}

function createEventDetails(event) {
    const startDate = event.start.toLocaleDateString('pt-BR');
    const startTime = event.start.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const endTime = event.end ? event.end.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 'Não definido';
    
    const room = event.extendedProps?.room || 'Sala não especificada';
    const organizer = event.extendedProps?.organizer || 'Organizador não definido';
    const description = event.extendedProps?.description || 'Sem descrição';
    const originalTitle = event.extendedProps?.originalTitle || event.title;
    
    return `
        <div class="event-details">
            <h4>${originalTitle}</h4>
            <div class="event-info">
                <p><i class="fas fa-calendar"></i> ${startDate}</p>
                <p><i class="fas fa-clock"></i> ${startTime} - ${endTime}</p>
                <p><i class="fas fa-door-open"></i> ${room}</p>
                <p><i class="fas fa-user"></i> ${organizer}</p>
                ${description !== 'Sem descrição' ? `<p><i class="fas fa-info-circle"></i> ${description}</p>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn-secondary" onclick="editEvent('${event.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="deleteEvent('${event.id}')" style="color: var(--secondary-color);">
                    <i class="fas fa-trash"></i> Cancelar
                </button>
            </div>
        </div>
    `;
}

// ==================== MODAL MANAGEMENT ====================
function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('actionModal').classList.add('show');
    
    // Setup form submission if it's a form
    const form = document.querySelector('#actionModal form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function closeModal() {
    document.getElementById('actionModal').classList.remove('show');
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    console.log('Form submitted:', data);
    console.log('Form ID:', e.target.id);
    
    showLoading();
    
    // Verificar tipo de formulário
    if (e.target.id === 'bookingForm' || e.target.id === 'quickBookingForm') {
        console.log('Calling handleBookingSubmission...');
        handleBookingSubmission(data);
    } else if (e.target.id === 'editBookingForm') {
        const eventId = e.target.getAttribute('data-event-id');
        handleEditBookingSubmission(data, eventId);
    } else {
        console.log('Other form type:', e.target.id);
        // Outras ações
        setTimeout(() => {
            hideLoading();
            closeModal();
            showNotification('Operação realizada com sucesso!', 'success');
        }, 1000);
    }
}

function handleBookingSubmission(data) {
    console.log('handleBookingSubmission called with:', data);
    console.log('Data recebida do formulário:', {
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room
    });
    
    // Validar dados obrigatórios
    if (!data.title || !data.date || !data.startTime || !data.endTime || !data.room) {
        hideLoading();
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Validar horários
    if (data.startTime >= data.endTime) {
        hideLoading();
        showNotification('O horário de início deve ser anterior ao horário de fim.', 'error');
        return;
    }
    
    // Verificar disponibilidade da sala
    const [year, month, day] = data.date.split('-');
    const [startHour, startMinute] = data.startTime.split(':');
    const [endHour, endMinute] = data.endTime.split(':');
    
    // Criar datas em horário local (sem conversão UTC)
    const requestedStart = new Date(year, month - 1, day, startHour, startMinute);
    const requestedEnd = new Date(year, month - 1, day, endHour, endMinute);
    
    console.log('Data solicitada:', data.date);
    console.log('Horário início:', data.startTime);
    console.log('Horário fim:', data.endTime);
    console.log('Data início criada:', requestedStart.toLocaleString());
    console.log('Data fim criada:', requestedEnd.toLocaleString());
    
    const conflicts = calendar.getEvents().filter(event => {
        // Verificar se é a mesma sala
        if (event.extendedProps.roomId !== data.room) return false;
        
        // Verificar sobreposição de horários
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        return (requestedStart < eventEnd && requestedEnd > eventStart);
    });
    
    if (conflicts.length > 0) {
        hideLoading();
        const conflictEvent = conflicts[0];
        const conflictTime = `${conflictEvent.start.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} - ${conflictEvent.end.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
        showNotification(`Conflito de horário! Esta sala já está reservada das ${conflictTime}.`, 'error');
        return;
    }
    
    // Criar evento para o calendário - usando horário local
    const startDateTime = `${data.date}T${data.startTime}:00`;
    const endDateTime = `${data.date}T${data.endTime}:00`;
    
    console.log('DateTime criado para evento:');
    console.log('Start:', startDateTime);
    console.log('End:', endDateTime);
    
    // Obter nome da sala
    const roomNames = {
        '1': 'Sala Alpha',
        '2': 'Sala Beta', 
        '3': 'Sala Gamma',
        '4': 'Sala Delta'
    };
    
    const roomName = roomNames[data.room] || 'Sala Desconhecida';
    
    // Criar novo evento
    const newEvent = {
        id: Date.now().toString(), // ID único baseado em timestamp
        title: `${data.title} - ${roomName}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: getRandomEventColor(),
        borderColor: getRandomEventColor(),
        extendedProps: {
            room: roomName,
            roomId: data.room,
            description: data.description || '',
            organizer: currentUser ? currentUser.name : 'Usuário',
            originalTitle: data.title
        }
    };
    
    // Adicionar evento ao calendário
    if (calendar) {
        console.log('Adding event to calendar:', newEvent);
        calendar.addEvent(newEvent);
        
        // Salvar evento no localStorage
        saveEvent(newEvent);
        
        console.log('Event added successfully to calendar and saved');
        console.log('Calendar events after addition:', calendar.getEvents().length);
    } else {
        console.error('Calendar is not initialized!');
    }
    
    // Atualizar atividade recente
    addRecentActivity({
        icon: 'fa-calendar-plus',
        title: `Nova reserva: ${data.title} - ${roomName}`,
        meta: `${currentUser ? currentUser.name : 'Usuário'} • agora`,
        color: 'var(--primary-color)'
    });
    
    // Atualizar KPIs
    updateKPIAfterBooking();
    
    // Simular salvamento na API (em produção, fazer chamada real)
    setTimeout(() => {
        hideLoading();
        closeModal();
        showNotification(`Reserva "${data.title}" criada com sucesso para ${formatDate(data.date)} das ${data.startTime} às ${data.endTime}!`, 'success');
        
        // Forçar re-renderização do calendário para garantir que o evento apareça
        if (calendar) {
            console.log('Force re-rendering calendar after booking...');
            calendar.render();
        }
        
        // Navegar para o calendário se não estiver nele
        if (getCurrentSection() !== 'calendar') {
            showSection('calendar');
        } else {
            // Se já estiver no calendário, garantir que está visível
            if (calendar) calendar.render();
        }
        
        // Ir para a data do evento
        if (calendar) {
            calendar.gotoDate(data.date);
        }
    }, 1000);
}

function getRandomEventColor() {
    const colors = [
        '#2563eb',
        '#3b82f6', 
        '#60a5fa',
        '#93c5fd',
        '#1d4ed8',
        '#1e40af'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('pt-BR', options);
}

function addRecentActivity(activity) {
    const activityList = document.getElementById('activityList');
    const newActivityHTML = `
        <div class="activity-item">
            <div class="activity-icon" style="background-color: ${activity.color}">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-meta">${activity.meta}</div>
            </div>
        </div>
    `;
    
    // Adicionar no topo da lista
    activityList.insertAdjacentHTML('afterbegin', newActivityHTML);
    
    // Remover atividades antigas se houver muitas (manter máximo 5)
    const activities = activityList.querySelectorAll('.activity-item');
    if (activities.length > 5) {
        activities[activities.length - 1].remove();
    }
}

function updateKPIAfterBooking() {
    // Incrementar reservas de hoje
    const todayBookingsElement = document.getElementById('todayBookings');
    const currentBookings = parseInt(todayBookingsElement.textContent);
    todayBookingsElement.textContent = currentBookings + 1;
    
    // Simular atualização da taxa de ocupação
    const occupancyElement = document.getElementById('occupancyRate');
    const currentOccupancy = parseInt(occupancyElement.textContent);
    const newOccupancy = Math.min(100, currentOccupancy + Math.floor(Math.random() * 5));
    occupancyElement.textContent = newOccupancy + '%';
}

// ==================== UTILITY FUNCTIONS ====================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showNotification(message, type = 'info') {
    // Criar sistema de notificação toast
    console.log(`${type.toUpperCase()}: ${message}`);
}

function loadUserData() {
    // Carregar dados específicos do usuário logado
}

function loadBookings() {
    // Carregar reservas
}

function loadUsers() {
    // Carregar usuários
}

function loadReports() {
    // Carregar relatórios
}

// ==================== ROOM ACTIONS ====================
function viewRoom(roomId) {
    console.log('Visualizar sala:', roomId);
}

function editRoom(roomId) {
    console.log('Editar sala:', roomId);
}

function bookRoom(roomId) {
    openModal('Nova Reserva', createBookingForm());
}

// ==================== RESPONSIVE HANDLING ====================
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('collapsed');
    } else {
        document.getElementById('sidebar').classList.remove('show');
    }
    
    // Redimensionar gráficos
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
});

// ==================== AUTO-REFRESH ====================
setInterval(() => {
    loadKPIs();
    loadRecentActivity();
    cleanExpiredEvents(); // Limpar eventos expirados periodicamente
}, 60000); // Atualizar a cada minuto

// ==================== RESPONSIVE HANDLING ====================
function handleScreenChange() {
    // Re-detectar dispositivo móvel após mudança de orientação/tela
    setTimeout(() => {
        const wasMobile = isMobileDevice;
        detectMobileDevice();
        
        if (wasMobile !== isMobileDevice) {
            console.log('🔄 Mudança de dispositivo detectada:', isMobileDevice ? 'Mobile' : 'Desktop');
            
            if (isMobileDevice) {
                applyMobileOptimizations();
            } else {
                removeMobileOptimizations();
            }
        }
        
        // Re-renderizar calendário se necessário
        if (calendar) {
            calendar.render();
        }
    }, 100);
}

function removeMobileOptimizations() {
    console.log('💻 Removendo otimizações móveis...');
    
    // Remover classe mobile
    document.body.classList.remove('mobile-device');
    
    // Restaurar sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('mobile-collapsed', 'mobile-show');
    }
    
    // Restaurar main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '';
        mainContent.style.width = '';
    }
    
    // Esconder overlay se existir
    const overlay = document.querySelector('.mobile-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ==================== EVENT MANAGEMENT ====================
function editEvent(eventId) {
    const event = calendar.getEventById(eventId);
    if (!event) {
        showNotification('Evento não encontrado.', 'error');
        return;
    }
    
    // Extrair dados do evento para preencher o formulário
    const eventData = {
        title: event.extendedProps.originalTitle || event.title,
        date: event.start.toISOString().split('T')[0],
        startTime: event.start.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}),
        endTime: event.end ? event.end.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}) : '',
        room: event.extendedProps.roomId || '',
        description: event.extendedProps.description || ''
    };
    
    // Fechar modal atual
    closeModal();
    
    // Abrir modal de edição
    setTimeout(() => {
        openModal('Editar Reserva', createEditBookingForm(eventData, eventId));
    }, 100);
}

function deleteEvent(eventId) {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
        const event = calendar.getEventById(eventId);
        if (event) {
            const eventTitle = event.extendedProps.originalTitle || event.title;
            
            // Remover do calendário
            event.remove();
            
            // Remover do localStorage
            let savedEvents = JSON.parse(localStorage.getItem('salalivre_events') || '[]');
            savedEvents = savedEvents.filter(e => e.id !== eventId);
            localStorage.setItem('salalivre_events', JSON.stringify(savedEvents));
            
            console.log('Evento removido do localStorage:', eventId);
            
            // Adicionar à atividade recente
            addRecentActivity({
                icon: 'fa-calendar-times',
                title: `Reserva cancelada: ${eventTitle}`,
                meta: `${currentUser ? currentUser.name : 'Usuário'} • agora`,
                color: 'var(--secondary-color)'
            });
            
            // Atualizar KPIs
            const todayBookingsElement = document.getElementById('todayBookings');
            const currentBookings = parseInt(todayBookingsElement.textContent);
            todayBookingsElement.textContent = Math.max(0, currentBookings - 1);
            
            closeModal();
            showNotification('Reserva cancelada com sucesso!', 'success');
        }
    }
}

function createEditBookingForm(eventData, eventId) {
    return `
        <form id="editBookingForm" class="modal-form" data-event-id="${eventId}">
            <div class="form-group">
                <label for="editBookingTitle">Título da Reunião</label>
                <input type="text" id="editBookingTitle" name="title" value="${eventData.title}" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editBookingDate">Data</label>
                    <input type="date" id="editBookingDate" name="date" value="${eventData.date}" required>
                </div>
                <div class="form-group">
                    <label for="editBookingRoom">Sala</label>
                    <select id="editBookingRoom" name="room" required>
                        <option value="">Selecione uma sala</option>
                        <option value="1" ${eventData.room === '1' ? 'selected' : ''}>Sala Alpha</option>
                        <option value="2" ${eventData.room === '2' ? 'selected' : ''}>Sala Beta</option>
                        <option value="3" ${eventData.room === '3' ? 'selected' : ''}>Sala Gamma</option>
                        <option value="4" ${eventData.room === '4' ? 'selected' : ''}>Sala Delta</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editBookingStartTime">Início</label>
                    <input type="time" id="editBookingStartTime" name="startTime" value="${eventData.startTime}" required>
                </div>
                <div class="form-group">
                    <label for="editBookingEndTime">Fim</label>
                    <input type="time" id="editBookingEndTime" name="endTime" value="${eventData.endTime}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="editBookingDescription">Descrição</label>
                <textarea id="editBookingDescription" name="description" rows="3">${eventData.description}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Salvar Alterações</button>
            </div>
        </form>
    `;
}

function handleEditBookingSubmission(data, eventId) {
    // Validar dados
    if (!data.title || !data.date || !data.startTime || !data.endTime || !data.room) {
        hideLoading();
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (data.startTime >= data.endTime) {
        hideLoading();
        showNotification('O horário de início deve ser anterior ao horário de fim.', 'error');
        return;
    }
    
    // Encontrar e atualizar evento
    const event = calendar.getEventById(eventId);
    if (event) {
        const roomNames = {
            '1': 'Sala Alpha',
            '2': 'Sala Beta', 
            '3': 'Sala Gamma',
            '4': 'Sala Delta'
        };
        
        const roomName = roomNames[data.room];
        const startDateTime = `${data.date}T${data.startTime}:00`;
        const endDateTime = `${data.date}T${data.endTime}:00`;
        
        // Atualizar propriedades do evento
        event.setProp('title', `${data.title} - ${roomName}`);
        event.setStart(startDateTime);
        event.setEnd(endDateTime);
        event.setExtendedProp('room', roomName);
        event.setExtendedProp('roomId', data.room);
        event.setExtendedProp('description', data.description);
        event.setExtendedProp('originalTitle', data.title);
        
        // Atualizar evento no localStorage
        updateEvent(eventId, {
            title: `${data.title} - ${roomName}`,
            start: startDateTime,
            end: endDateTime,
            extendedProps: {
                room: roomName,
                roomId: data.room,
                description: data.description,
                originalTitle: data.title
            }
        });
        
        // Adicionar à atividade recente
        addRecentActivity({
            icon: 'fa-edit',
            title: `Reserva atualizada: ${data.title} - ${roomName}`,
            meta: `${currentUser ? currentUser.name : 'Usuário'} • agora`,
            color: 'var(--accent-color)'
        });
        
        setTimeout(() => {
            hideLoading();
            closeModal();
            showNotification(`Reserva "${data.title}" atualizada com sucesso!`, 'success');
        }, 500);
    } else {
        hideLoading();
        showNotification('Erro: Evento não encontrado.', 'error');
    }
}

// ==================== RESERVAS MANAGEMENT ====================
let bookingsData = [];

function initializeBookingsSection() {
    loadBookingsData();
    setupBookingsEventListeners();
}

function loadBookingsData() {
    // Simular dados de reservas
    bookingsData = [
        {
            id: 'BK001',
            title: 'Reunião Alpha - Marketing',
            room: 'Sala Alpha',
            date: '2025-08-03',
            startTime: '09:00',
            endTime: '10:30',
            organizer: 'João Silva',
            status: 'confirmed'
        },
        {
            id: 'BK002',
            title: 'Treinamento Beta',
            room: 'Sala Beta',
            date: '2025-08-03',
            startTime: '14:00',
            endTime: '16:00',
            organizer: 'Maria Santos',
            status: 'pending'
        },
        {
            id: 'BK003',
            title: 'Reunião Cancelada',
            room: 'Sala Gamma',
            date: '2025-08-02',
            startTime: '10:00',
            endTime: '11:00',
            organizer: 'Pedro Lima',
            status: 'cancelled'
        }
    ];
    
    renderBookingsTable();
}

function renderBookingsTable() {
    const tbody = document.querySelector('#bookingsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = bookingsData.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.title}</td>
            <td>${booking.room}</td>
            <td>${formatDateForDisplay(booking.date)}</td>
            <td>${booking.startTime} - ${booking.endTime}</td>
            <td>${booking.organizer}</td>
            <td><span class="booking-status ${booking.status}">${getStatusText(booking.status)}</span></td>
            <td>
                <button class="room-action-btn" onclick="editBooking('${booking.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="room-action-btn" onclick="deleteBooking('${booking.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmada',
        'pending': 'Pendente',
        'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
}

function setupBookingsEventListeners() {
    const newBookingBtn = document.getElementById('newBookingBtn');
    const bookingSearch = document.getElementById('bookingSearch');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const bookingDateFilter = document.getElementById('bookingDateFilter');
    
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', () => {
            openBookingModal();
        });
    }
    
    if (bookingSearch) {
        bookingSearch.addEventListener('input', filterBookings);
    }
    
    if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener('change', filterBookings);
    }
    
    if (bookingDateFilter) {
        bookingDateFilter.addEventListener('change', filterBookings);
    }
}

function filterBookings() {
    // Implementar filtros de reservas
    console.log('Filtrando reservas...');
}

// ==================== USERS MANAGEMENT ====================
let usersData = [];

function initializeUsersSection() {
    loadUsersData();
    setupUsersEventListeners();
}

function loadUsersData() {
    // Simular dados de usuários
    usersData = [
        {
            id: 'U001',
            name: 'João Silva',
            email: 'joao.silva@empresa.com',
            role: 'admin',
            department: 'ti',
            lastAccess: '2025-08-03T10:30:00',
            status: 'active'
        },
        {
            id: 'U002',
            name: 'Maria Santos',
            email: 'maria.santos@empresa.com',
            role: 'manager',
            department: 'rh',
            lastAccess: '2025-08-02T16:45:00',
            status: 'active'
        },
        {
            id: 'U003',
            name: 'Pedro Lima',
            email: 'pedro.lima@empresa.com',
            role: 'user',
            department: 'vendas',
            lastAccess: '2025-08-01T14:20:00',
            status: 'inactive'
        }
    ];
    
    renderUsersGrid();
}

function renderUsersGrid() {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    usersGrid.innerHTML = usersData.map(user => `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-card-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-card-info">
                    <h3>${user.name}</h3>
                    <span class="user-card-role">${getRoleText(user.role)}</span>
                </div>
            </div>
            <div class="user-card-details">
                <div class="user-card-detail">
                    <i class="fas fa-envelope"></i>
                    <span>${user.email}</span>
                </div>
                <div class="user-card-detail">
                    <i class="fas fa-building"></i>
                    <span>${getDepartmentText(user.department)}</span>
                </div>
                <div class="user-card-detail">
                    <i class="fas fa-clock"></i>
                    <span>Último acesso: ${formatDateForDisplay(user.lastAccess.split('T')[0])}</span>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="room-action-btn" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="room-action-btn" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="room-action-btn primary" onclick="viewUserDetails('${user.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getRoleText(role) {
    const roleMap = {
        'admin': 'Administrador',
        'manager': 'Gerente',
        'user': 'Usuário'
    };
    return roleMap[role] || role;
}

function getDepartmentText(department) {
    const deptMap = {
        'ti': 'Tecnologia',
        'rh': 'Recursos Humanos',
        'vendas': 'Vendas',
        'marketing': 'Marketing'
    };
    return deptMap[department] || department;
}

function setupUsersEventListeners() {
    const addUserBtn = document.getElementById('addUserBtn');
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            openUserModal();
        });
    }
    
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }
    
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterUsers);
    }
}

function filterUsers() {
    // Implementar filtros de usuários
    console.log('Filtrando usuários...');
}

// ==================== REPORTS MANAGEMENT ====================
function initializeReportsSection() {
    setupReportsEventListeners();
    loadReportsData();
}

function setupReportsEventListeners() {
    const exportBtn = document.getElementById('exportReportBtn');
    const tabBtns = document.querySelectorAll('.reports-tabs .tab-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchReportsTab(tab);
        });
    });
}

function switchReportsTab(activeTab) {
    // Remover classe ativa de todos os botões e conteúdos
    document.querySelectorAll('.reports-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.reports-content .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar classe ativa ao botão e conteúdo selecionados
    document.querySelector(`[data-tab="${activeTab}"]`).classList.add('active');
    document.getElementById(`${activeTab}-tab`).classList.add('active');
}

function loadReportsData() {
    // Simular dados para relatórios
    document.getElementById('totalUsers').textContent = usersData.length;
    document.getElementById('activeUsers').textContent = usersData.filter(u => u.status === 'active').length;
    document.getElementById('avgBookingsPerUser').textContent = '2.5';
}

function exportReport() {
    showNotification('Relatório exportado com sucesso!', 'success');
}

// ==================== SETTINGS MANAGEMENT ====================
function initializeSettingsSection() {
    setupSettingsEventListeners();
    loadSettingsData();
}

function setupSettingsEventListeners() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const tabBtns = document.querySelectorAll('.settings-tabs .tab-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchSettingsTab(tab);
        });
    });
}

function switchSettingsTab(activeTab) {
    // Remover classe ativa de todos os botões e conteúdos
    document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.settings-content .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar classe ativa ao botão e conteúdo selecionados
    document.querySelector(`[data-tab="${activeTab}"]`).classList.add('active');
    document.getElementById(`${activeTab}-tab`).classList.add('active');
}

function loadSettingsData() {
    // Carregar configurações salvas
    const settings = JSON.parse(localStorage.getItem('salalivre_settings') || '{}');
    
    // Aplicar configurações aos campos
    if (settings.companyName) {
        document.getElementById('companyName').value = settings.companyName;
    }
    if (settings.timezone) {
        document.getElementById('timezone').value = settings.timezone;
    }
    if (settings.startTime) {
        document.getElementById('startTime').value = settings.startTime;
    }
    if (settings.endTime) {
        document.getElementById('endTime').value = settings.endTime;
    }
}

function saveSettings() {
    const settings = {
        companyName: document.getElementById('companyName').value,
        timezone: document.getElementById('timezone').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked,
        pushNotifications: document.getElementById('pushNotifications').checked,
        passwordPolicy: document.getElementById('passwordPolicy').value,
        sessionTimeout: document.getElementById('sessionTimeout').value
    };
    
    localStorage.setItem('salalivre_settings', JSON.stringify(settings));
    showNotification('Configurações salvas com sucesso!', 'success');
}

// ==================== MODAL FUNCTIONS ====================
function openBookingModal() {
    const modal = document.getElementById('actionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'Nova Reserva';
    modalBody.innerHTML = createBookingForm();
    
    modal.classList.add('show');
}

function openUserModal() {
    const modal = document.getElementById('actionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'Novo Usuário';
    modalBody.innerHTML = createUserForm();
    
    modal.classList.add('show');
}

function createUserForm() {
    return `
        <form id="userForm" class="modal-form">
            <div class="form-group">
                <label for="userName">Nome Completo</label>
                <input type="text" id="userName" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="userEmail">E-mail</label>
                <input type="email" id="userEmail" name="email" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="userRole">Perfil</label>
                    <select id="userRole" name="role" required>
                        <option value="">Selecionar perfil</option>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="user">Usuário</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="userDepartment">Departamento</label>
                    <select id="userDepartment" name="department" required>
                        <option value="">Selecionar departamento</option>
                        <option value="ti">Tecnologia</option>
                        <option value="rh">Recursos Humanos</option>
                        <option value="vendas">Vendas</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="userPassword">Senha</label>
                <input type="password" id="userPassword" name="password" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Criar Usuário</button>
            </div>
        </form>
    `;
}

// ==================== CRUD FUNCTIONS ====================
function editBooking(bookingId) {
    console.log('Editando reserva:', bookingId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

async function deleteBooking(bookingId) {
    if (confirm('Tem certeza que deseja excluir esta reserva?')) {
        try {
            // Se API disponível, deletar via API
            if (window.salaLivreAPI && window.salaLivreAPI.isAuthenticated()) {
                const response = await window.salaLivreAPI.deleteBooking(bookingId);
                if (response.success) {
                    console.log('✅ Reunião deletada via API');
                    
                    // Remover do calendário
                    const event = window.calendar?.getEventById(bookingId);
                    if (event) {
                        event.remove();
                    }
                    
                    showNotification('Reserva excluída com sucesso!', 'success');
                    
                    // 🔄 SINCRONIZAR COM TODOS OS USUÁRIOS
                    if (window.autoSync) {
                        await window.autoSync.syncAfterChange('reunião excluída', { id: bookingId });
                    }
                    
                    return;
                }
            }
            
            // Fallback para dados locais
            bookingsData = bookingsData.filter(b => b.id !== bookingId);
            renderBookingsTable();
            
            // Remover do calendário se existir
            const event = window.calendar?.getEventById(bookingId);
            if (event) {
                event.remove();
            }
            
            showNotification('Reserva excluída com sucesso!', 'success');
            
            // 🔄 SINCRONIZAR MESMO NO FALLBACK
            if (window.autoSync) {
                await window.autoSync.syncAfterChange('reunião excluída (local)', { id: bookingId });
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir reunião:', error);
            showNotification('Erro ao excluir reserva: ' + error.message, 'error');
        }
    }
}

function editUser(userId) {
    console.log('Editando usuário:', userId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        usersData = usersData.filter(u => u.id !== userId);
        renderUsersGrid();
        showNotification('Usuário excluído com sucesso!', 'success');
        
        // Notificar sistema avançado se disponível
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.addNotification('user', 'Usuário Removido', `Usuário excluído do sistema`);
        }
    }
}

function viewUserDetails(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        showNotification(`Visualizando detalhes de: ${user.name}`, 'info');
    }
}

// ==================== INTEGRAÇÃO COM SISTEMAS AVANÇADOS ====================

// Integrar notificações avançadas com ações do sistema
function integrateAdvancedSystems() {
    console.log('🔗 Integrando sistemas avançados...');
    
    // Override da função showNotification para usar sistema avançado
    const originalShowNotification = window.showNotification;
    window.showNotification = function(message, type = 'info') {
        // Usar sistema avançado se disponível
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.addNotification(type, 'Sistema', message);
        } else {
            // Fallback para sistema original
            originalShowNotification(message, type);
        }
    };
    
    // Integrar com eventos de reserva
    window.addEventListener('bookingCreated', (event) => {
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.notifyNewBooking(event.detail);
        }
    });
    
    window.addEventListener('bookingCancelled', (event) => {
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.notifyBookingCancelled(event.detail);
        }
    });
    
    // Integrar tema com gráficos
    window.addEventListener('themeChanged', (event) => {
        updateChartsTheme(event.detail.theme);
    });
    
    console.log('✅ Sistemas avançados integrados');
}

// Atualizar tema dos gráficos
function updateChartsTheme(theme) {
    if (!window.themeManager) return;
    
    const isDark = themeManager.isDarkMode();
    const colors = themeManager.getThemeColors();
    
    // Atualizar cores dos gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart && chart.options) {
            // Atualizar cores do texto
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = colors['--text-primary'];
            }
            
            // Atualizar cores dos eixos
            if (chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (scale.ticks) scale.ticks.color = colors['--text-secondary'];
                    if (scale.grid) scale.grid.color = colors['--border-color'];
                });
            }
            
            chart.update();
        }
    });
}

// Enhanced event dispatching
function dispatchBookingEvent(type, bookingData) {
    const event = new CustomEvent(type, { 
        detail: bookingData,
        bubbles: true 
    });
    window.dispatchEvent(event);
}

// Keyboard shortcuts enhancement
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+N: Nova reserva rápida
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        showSection('calendar');
        // Abrir modal de nova reserva se existir
        setTimeout(() => {
            const addBtn = document.querySelector('[onclick*="addEvent"]');
            if (addBtn) addBtn.click();
        }, 500);
    }
    
    // Ctrl+Shift+E: Exportar dados
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (typeof exportManager !== 'undefined') {
            exportManager.openModal();
        }
    }
    
    // Ctrl+Shift+T: Alternar tema
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (typeof themeManager !== 'undefined') {
            const currentTheme = themeManager.getCurrentTheme();
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            themeManager.setTheme(newTheme);
        }
    }
});

// Integração com PWA
function setupPWAIntegration() {
    // Verificar se está rodando como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-mode');
        console.log('🔱 Rodando como PWA');
        
        // Notificar sobre modo PWA
        setTimeout(() => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.addNotification('success', 'PWA Ativo', 'Aplicativo instalado e funcionando offline!');
            }
        }, 3000);
    }
    
    // Verificar status da conexão
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        document.body.classList.toggle('offline', !isOnline);
        
        if (typeof notificationSystem !== 'undefined') {
            if (!isOnline) {
                notificationSystem.addNotification('warning', 'Offline', 'Modo offline ativado. Dados serão sincronizados quando a conexão retornar.');
            } else {
                notificationSystem.addNotification('success', 'Online', 'Conexão restaurada. Sincronizando dados...');
            }
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// Inicializar integrações quando sistemas estiverem prontos
setTimeout(() => {
    integrateAdvancedSystems();
    setupPWAIntegration();
}, 2000);

console.log('🎯 Dashboard Sala Livre carregado com todas as melhorias!');
