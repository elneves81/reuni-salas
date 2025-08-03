// ==================== DASHBOARD EXECUTIVO JS ====================

// Configuração da API
const API_BASE_URL = 'https://salalivre.netlify.app/.netlify/functions';

// Variáveis globais
let currentUser = null;
let calendar = null;
let charts = {};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Verificar autenticação
    checkAuthentication();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar componentes
    initializeCharts();
    initializeCalendar();
    loadDashboardData();
    
    // Configurar sidebar
    setupSidebar();
    
    // Verificar dados do usuário
    loadUserData();
}

// ==================== AUTENTICAÇÃO ====================
function checkAuthentication() {
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
        document.getElementById('userRole').textContent = currentUser.role || 'User';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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
        bookings: 'Reservas',
        users: 'Usuários',
        reports: 'Relatórios',
        settings: 'Configurações'
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
        case 'bookings':
            loadBookings();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reports':
            loadReports();
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
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
                    'var(--primary-color)',
                    'var(--accent-color)',
                    'var(--secondary-color)',
                    '#f59e0b'
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
        events: [
            {
                title: 'Reunião Alpha - Equipe Marketing',
                start: '2025-08-01T09:00:00',
                end: '2025-08-01T10:30:00',
                backgroundColor: 'var(--primary-color)',
                borderColor: 'var(--primary-color)'
            },
            {
                title: 'Sala Beta - Treinamento',
                start: '2025-08-01T14:00:00',
                end: '2025-08-01T16:00:00',
                backgroundColor: 'var(--accent-color)',
                borderColor: 'var(--accent-color)'
            },
            {
                title: 'Sala Gamma - Apresentação',
                start: '2025-08-02T10:00:00',
                end: '2025-08-02T11:00:00',
                backgroundColor: 'var(--secondary-color)',
                borderColor: 'var(--secondary-color)'
            }
        ],
        eventClick: function(info) {
            openModal('Detalhes da Reserva', createEventDetails(info.event));
        },
        dateClick: function(info) {
            openModal('Nova Reserva', createBookingForm(info.dateStr));
        },
        datesSet: function(info) {
            // Atualizar o título do mês sempre que as datas mudarem
            updateCalendarTitle(info.start);
        }
    });
    
    // Renderizar o calendário
    calendar.render();
    
    // Inicializar navegação do calendário
    initCalendarNavigation();
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
function createBookingForm(date = '') {
    return `
        <form id="bookingForm" class="modal-form">
            <div class="form-group">
                <label for="bookingTitle">Título da Reunião</label>
                <input type="text" id="bookingTitle" name="title" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="bookingDate">Data</label>
                    <input type="date" id="bookingDate" name="date" value="${date}" required>
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
        console.log('Event added successfully to calendar');
        console.log('Calendar events after addition:', calendar.getEvents());
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
        'var(--primary-color)',
        'var(--accent-color)', 
        'var(--secondary-color)',
        '#f59e0b',
        '#8b5cf6',
        '#06b6d4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
}, 60000); // Atualizar a cada minuto

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
            event.remove();
            
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
