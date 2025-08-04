// ==================== SISTEMA DE BUSCA GLOBAL ====================

class GlobalSearchManager {
    constructor() {
        this.searchIndex = {};
        this.searchHistory = JSON.parse(localStorage.getItem('salalivre_search_history') || '[]');
        this.isSearching = false;
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.buildSearchIndex();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    createSearchInterface() {
        // Substituir search simples por search avançada
        const existingSearch = document.querySelector('.search-container');
        if (existingSearch) {
            existingSearch.remove();
        }

        const searchContainer = document.createElement('div');
        searchContainer.className = 'global-search-container';
        searchContainer.innerHTML = `
            <div class="search-input-container">
                <div class="search-input-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        id="globalSearchInput" 
                        placeholder="Buscar em todo o sistema... (Ctrl+K)"
                        autocomplete="off"
                    >
                    <div class="search-actions">
                        <button class="search-filter-btn" id="searchFilterBtn" title="Filtros">
                            <i class="fas fa-filter"></i>
                        </button>
                        <button class="search-clear-btn" id="searchClearBtn" title="Limpar" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="search-filters" id="searchFilters" style="display: none;">
                    <div class="filter-section">
                        <h4>Tipo de Conteúdo</h4>
                        <div class="filter-options">
                            <label><input type="checkbox" value="reservations" checked> Reservas</label>
                            <label><input type="checkbox" value="users" checked> Usuários</label>
                            <label><input type="checkbox" value="rooms" checked> Salas</label>
                            <label><input type="checkbox" value="reports" checked> Relatórios</label>
                        </div>
                    </div>
                    <div class="filter-section">
                        <h4>Período</h4>
                        <div class="filter-options">
                            <select id="searchPeriod">
                                <option value="all">Todos os períodos</option>
                                <option value="today">Hoje</option>
                                <option value="week">Esta semana</option>
                                <option value="month">Este mês</option>
                                <option value="year">Este ano</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="search-results" id="searchResults" style="display: none;">
                <div class="search-header">
                    <div class="search-stats" id="searchStats"></div>
                    <div class="search-sort">
                        <select id="searchSort">
                            <option value="relevance">Relevância</option>
                            <option value="date">Data</option>
                            <option value="type">Tipo</option>
                        </select>
                    </div>
                </div>
                <div class="search-content" id="searchContent"></div>
            </div>

            <div class="search-suggestions" id="searchSuggestions" style="display: none;">
                <div class="suggestions-header">
                    <h4>Sugestões</h4>
                </div>
                <div class="suggestions-content" id="suggestionsContent"></div>
            </div>
        `;

        // Inserir no header
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerContent.appendChild(searchContainer);
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('globalSearchInput');
        const searchFilterBtn = document.getElementById('searchFilterBtn');
        const searchClearBtn = document.getElementById('searchClearBtn');
        const searchFilters = document.getElementById('searchFilters');

        // Input de busca
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                this.clearSearch();
                return;
            }

            searchClearBtn.style.display = 'block';

            if (query.length < 2) {
                this.showSuggestions(query);
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Botão de filtros
        searchFilterBtn.addEventListener('click', () => {
            searchFilters.style.display = searchFilters.style.display === 'none' ? 'block' : 'none';
        });

        // Botão limpar
        searchClearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Mudança de filtros
        searchFilters.addEventListener('change', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                this.performSearch(query);
            }
        });

        // Sort
        const searchSort = document.getElementById('searchSort');
        searchSort.addEventListener('change', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                this.performSearch(query);
            }
        });

        // Clique fora para fechar
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-search-container')) {
                document.getElementById('searchSuggestions').style.display = 'none';
                document.getElementById('searchFilters').style.display = 'none';
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K para focar na busca
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearchInput').focus();
            }

            // ESC para limpar busca
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    buildSearchIndex() {
        // Construir índice de busca com dados simulados
        this.searchIndex = {
            reservations: [
                {
                    id: 'res_1',
                    type: 'reservation',
                    title: 'Reunião Equipe Marketing',
                    content: 'Reunião semanal da equipe de marketing para discutir campanhas',
                    room: 'Sala A',
                    user: 'João Silva',
                    date: '2024-01-15',
                    time: '09:00-10:00',
                    status: 'Confirmado',
                    keywords: ['reuniao', 'marketing', 'campanha', 'semanal']
                },
                {
                    id: 'res_2',
                    type: 'reservation',
                    title: 'Apresentação Projeto Alpha',
                    content: 'Apresentação do projeto Alpha para stakeholders',
                    room: 'Sala B',
                    user: 'Maria Santos',
                    date: '2024-01-16',
                    time: '14:00-15:00',
                    status: 'Pendente',
                    keywords: ['apresentacao', 'projeto', 'alpha', 'stakeholders']
                }
            ],
            users: [
                {
                    id: 'user_1',
                    type: 'user',
                    title: 'João Silva',
                    content: 'Desenvolvedor Frontend - Departamento de TI',
                    email: 'joao.silva@empresa.com',
                    department: 'TI',
                    role: 'Desenvolvedor',
                    keywords: ['joao', 'silva', 'desenvolvedor', 'frontend', 'ti']
                },
                {
                    id: 'user_2',
                    type: 'user',
                    title: 'Maria Santos',
                    content: 'Analista de RH - Departamento de Recursos Humanos',
                    email: 'maria.santos@empresa.com',
                    department: 'RH',
                    role: 'Analista',
                    keywords: ['maria', 'santos', 'analista', 'rh', 'recursos', 'humanos']
                }
            ],
            rooms: [
                {
                    id: 'room_1',
                    type: 'room',
                    title: 'Sala de Reuniões A',
                    content: 'Sala com capacidade para 10 pessoas, equipada com projetor e tela',
                    capacity: 10,
                    equipment: ['Projetor', 'Tela', 'Wi-Fi'],
                    status: 'Disponível',
                    keywords: ['sala', 'reunioes', 'projetor', 'tela', 'wifi']
                },
                {
                    id: 'room_2',
                    type: 'room',
                    title: 'Sala de Conferências B',
                    content: 'Sala executive com capacidade para 20 pessoas',
                    capacity: 20,
                    equipment: ['TV 55"', 'Sistema de Som', 'Videoconferência'],
                    status: 'Ocupada',
                    keywords: ['sala', 'conferencias', 'executiva', 'tv', 'som', 'videoconferencia']
                }
            ],
            reports: [
                {
                    id: 'report_1',
                    type: 'report',
                    title: 'Relatório de Ocupação - Janeiro 2024',
                    content: 'Relatório mensal de ocupação das salas de reunião',
                    period: 'Janeiro 2024',
                    data: { occupation: '78%', total_bookings: 45 },
                    keywords: ['relatorio', 'ocupacao', 'janeiro', 'mensal', 'salas']
                }
            ]
        };
    }

    performSearch(query) {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.addToSearchHistory(query);

        const filters = this.getActiveFilters();
        const sortBy = document.getElementById('searchSort').value;
        
        // Simular delay de busca
        setTimeout(() => {
            const results = this.search(query, filters, sortBy);
            this.displayResults(results, query);
            this.isSearching = false;
        }, 200);
    }

    search(query, filters, sortBy) {
        const results = [];
        const searchTerms = query.toLowerCase().split(' ');

        Object.entries(this.searchIndex).forEach(([category, items]) => {
            if (!filters.types.includes(category)) return;

            items.forEach(item => {
                const score = this.calculateRelevanceScore(item, searchTerms);
                if (score > 0) {
                    results.push({
                        ...item,
                        category,
                        score,
                        highlight: this.highlightText(item, searchTerms)
                    });
                }
            });
        });

        return this.sortResults(results, sortBy);
    }

    calculateRelevanceScore(item, searchTerms) {
        let score = 0;
        const text = `${item.title} ${item.content} ${item.keywords?.join(' ')}`.toLowerCase();

        searchTerms.forEach(term => {
            if (item.title.toLowerCase().includes(term)) score += 10;
            if (item.content.toLowerCase().includes(term)) score += 5;
            if (item.keywords?.some(keyword => keyword.includes(term))) score += 3;
            if (text.includes(term)) score += 1;
        });

        return score;
    }

    highlightText(item, searchTerms) {
        let title = item.title;
        let content = item.content;

        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            title = title.replace(regex, '<mark>$1</mark>');
            content = content.replace(regex, '<mark>$1</mark>');
        });

        return { title, content };
    }

    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'date':
                return results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            case 'type':
                return results.sort((a, b) => a.type.localeCompare(b.type));
            case 'relevance':
            default:
                return results.sort((a, b) => b.score - a.score);
        }
    }

    displayResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        const statsContainer = document.getElementById('searchStats');
        const contentContainer = document.getElementById('searchContent');

        // Estatísticas
        statsContainer.innerHTML = `
            <span>${results.length} resultado(s) encontrado(s) para "${query}"</span>
            <span class="search-time">em ${Math.random() * 100 + 50 | 0}ms</span>
        `;

        // Resultados
        if (results.length === 0) {
            contentContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente termos diferentes ou verifique os filtros</p>
                </div>
            `;
        } else {
            contentContainer.innerHTML = results.map(result => this.renderSearchResult(result)).join('');
        }

        resultsContainer.style.display = 'block';
        document.getElementById('searchSuggestions').style.display = 'none';
    }

    renderSearchResult(result) {
        const icons = {
            reservation: 'fa-calendar-check',
            user: 'fa-user',
            room: 'fa-door-open',
            report: 'fa-chart-bar'
        };

        return `
            <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
                <div class="result-icon">
                    <i class="fas ${icons[result.type]}"></i>
                </div>
                <div class="result-content">
                    <div class="result-header">
                        <h4 class="result-title">${result.highlight.title}</h4>
                        <span class="result-type">${this.getTypeLabel(result.type)}</span>
                    </div>
                    <p class="result-description">${result.highlight.content}</p>
                    <div class="result-meta">
                        ${this.renderResultMeta(result)}
                    </div>
                </div>
                <div class="result-actions">
                    <button class="result-action-btn" onclick="globalSearchManager.openResult('${result.type}', '${result.id}')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderResultMeta(result) {
        switch (result.type) {
            case 'reservation':
                return `
                    <span><i class="fas fa-door-open"></i> ${result.room}</span>
                    <span><i class="fas fa-user"></i> ${result.user}</span>
                    <span><i class="fas fa-clock"></i> ${result.date} ${result.time}</span>
                `;
            case 'user':
                return `
                    <span><i class="fas fa-building"></i> ${result.department}</span>
                    <span><i class="fas fa-briefcase"></i> ${result.role}</span>
                    <span><i class="fas fa-envelope"></i> ${result.email}</span>
                `;
            case 'room':
                return `
                    <span><i class="fas fa-users"></i> ${result.capacity} pessoas</span>
                    <span><i class="fas fa-tools"></i> ${result.equipment.join(', ')}</span>
                    <span><i class="fas fa-circle"></i> ${result.status}</span>
                `;
            case 'report':
                return `
                    <span><i class="fas fa-calendar"></i> ${result.period}</span>
                    <span><i class="fas fa-chart-line"></i> ${result.data.occupation} ocupação</span>
                `;
            default:
                return '';
        }
    }

    getTypeLabel(type) {
        const labels = {
            reservation: 'Reserva',
            user: 'Usuário',
            room: 'Sala',
            report: 'Relatório'
        };
        return labels[type] || type;
    }

    showSuggestions(query) {
        const suggestions = this.getSuggestions(query);
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const contentContainer = document.getElementById('suggestionsContent');

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        contentContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="globalSearchManager.applySuggestion('${suggestion}')">
                <i class="fas fa-search"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
    }

    getSuggestions(query) {
        const suggestions = [
            'reunião', 'sala', 'reserva', 'usuário', 'relatório',
            'marketing', 'projeto', 'apresentação', 'conferência',
            'disponível', 'ocupada', 'confirmado', 'pendente'
        ];

        return suggestions
            .filter(s => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);
    }

    applySuggestion(suggestion) {
        document.getElementById('globalSearchInput').value = suggestion;
        this.performSearch(suggestion);
    }

    openResult(type, id) {
        // Navegar para o resultado específico
        switch (type) {
            case 'reservation':
                showSection('calendar');
                break;
            case 'user':
                showSection('users');
                break;
            case 'room':
                showSection('rooms');
                break;
            case 'report':
                showSection('reports');
                break;
        }

        // Fechar busca
        this.clearSearch();

        // Notificar sobre navegação
        if (window.notificationSystem) {
            notificationSystem.addNotification('info', 'Navegação', `Direcionado para ${this.getTypeLabel(type)}`);
        }
    }

    getActiveFilters() {
        const typeCheckboxes = document.querySelectorAll('#searchFilters input[type="checkbox"]:checked');
        const period = document.getElementById('searchPeriod').value;

        return {
            types: Array.from(typeCheckboxes).map(cb => cb.value),
            period: period
        };
    }

    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Manter apenas 10
            localStorage.setItem('salalivre_search_history', JSON.stringify(this.searchHistory));
        }
    }

    clearSearch() {
        document.getElementById('globalSearchInput').value = '';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchSuggestions').style.display = 'none';
        document.getElementById('searchFilters').style.display = 'none';
        document.getElementById('searchClearBtn').style.display = 'none';
    }
}

// Inicializar busca global
let globalSearchManager;
document.addEventListener('DOMContentLoaded', () => {
    globalSearchManager = new GlobalSearchManager();
});
