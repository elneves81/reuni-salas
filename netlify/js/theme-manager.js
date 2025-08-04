// ==================== SISTEMA DE TEMAS (MODO ESCURO/CLARO) ====================

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('salalivre_theme') || 'light';
        this.themes = {
            light: {
                name: 'Claro',
                icon: 'fa-sun',
                colors: {
                    '--primary-color': '#2563eb',
                    '--secondary-color': '#3b82f6',
                    '--accent-color': '#1d4ed8',
                    '--bg-color': '#ffffff',
                    '--surface-color': '#f8fafc',
                    '--text-primary': '#1e293b',
                    '--text-secondary': '#64748b',
                    '--border-color': '#e2e8f0',
                    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
                    '--success-color': '#10b981',
                    '--warning-color': '#f59e0b',
                    '--error-color': '#ef4444',
                    '--card-bg': '#ffffff',
                    '--sidebar-bg': '#f1f5f9',
                    '--navbar-bg': '#ffffff',
                    '--modal-bg': '#ffffff',
                    '--hover-bg': '#f1f5f9'
                }
            },
            dark: {
                name: 'Escuro',
                icon: 'fa-moon',
                colors: {
                    '--primary-color': '#3b82f6',
                    '--secondary-color': '#6366f1',
                    '--accent-color': '#4f46e5',
                    '--bg-color': '#0f172a',
                    '--surface-color': '#1e293b',
                    '--text-primary': '#f1f5f9',
                    '--text-secondary': '#94a3b8',
                    '--border-color': '#334155',
                    '--shadow-color': 'rgba(0, 0, 0, 0.3)',
                    '--success-color': '#10b981',
                    '--warning-color': '#f59e0b',
                    '--error-color': '#ef4444',
                    '--card-bg': '#1e293b',
                    '--sidebar-bg': '#0f172a',
                    '--navbar-bg': '#1e293b',
                    '--modal-bg': '#1e293b',
                    '--hover-bg': '#334155'
                }
            },
            auto: {
                name: 'Automático',
                icon: 'fa-adjust',
                colors: null // Será definido dinamicamente
            }
        };
        this.init();
    }

    init() {
        this.createThemeToggle();
        this.applyTheme(this.currentTheme);
        this.setupSystemThemeListener();
        this.setupThemeTransitions();
    }

    createThemeToggle() {
        // Verificar se já existe
        const existingToggle = document.querySelector('.theme-toggle-container');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Adicionar botão de tema no header
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle-container';
        themeToggle.innerHTML = `
            <button class="theme-toggle-btn" id="themeToggleBtn" title="Alterar Tema">
                <i class="fas ${this.themes[this.currentTheme].icon}"></i>
            </button>
            <div class="theme-dropdown" id="themeDropdown" style="display: none;">
                <div class="theme-option ${this.currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                    <i class="fas fa-sun"></i>
                    <span>Claro</span>
                </div>
                <div class="theme-option ${this.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                    <i class="fas fa-moon"></i>
                    <span>Escuro</span>
                </div>
                <div class="theme-option ${this.currentTheme === 'auto' ? 'active' : ''}" data-theme="auto">
                    <i class="fas fa-adjust"></i>
                    <span>Automático</span>
                </div>
            </div>
        `;

        // Inserir próximo ao botão de notificações
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.insertBefore(themeToggle, headerActions.firstChild);
        }

        this.setupThemeToggleEvents();
    }

    setupThemeToggleEvents() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        const dropdown = document.getElementById('themeDropdown');

        if (!toggleBtn || !dropdown) return;

        // Toggle dropdown
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            
            if (isOpen) {
                dropdown.style.display = 'none';
                dropdown.classList.remove('open');
            } else {
                dropdown.style.display = 'block';
                setTimeout(() => dropdown.classList.add('open'), 10);
            }
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.theme-toggle-container')) {
                dropdown.style.display = 'none';
                dropdown.classList.remove('open');
            }
        });

        // Seleção de tema
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const option = e.target.closest('.theme-option');
            if (option) {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                dropdown.style.display = 'none';
                dropdown.classList.remove('open');
            }
        });
    }

    setupSystemThemeListener() {
        // Escutar mudanças no tema do sistema
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    setupThemeTransitions() {
        // Adicionar transições suaves para mudança de tema
        const style = document.createElement('style');
        style.textContent = `
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('salalivre_theme', theme);
        this.applyTheme(theme);
        this.updateToggleIcon();
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }

    applyTheme(theme) {
        let colors;
        
        if (theme === 'auto') {
            // Detectar preferência do sistema
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            colors = this.themes[prefersDark ? 'dark' : 'light'].colors;
        } else {
            colors = this.themes[theme].colors;
        }

        // Aplicar variáveis CSS
        const root = document.documentElement;
        Object.entries(colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Adicionar classe do tema ao body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);

        // Atualizar meta theme-color para mobile
        this.updateThemeColor(colors['--primary-color']);
    }

    updateThemeColor(color) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.content = color;
    }

    updateToggleIcon() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = `fas ${this.themes[this.currentTheme].icon}`;
            }
            
            // Atualizar opção ativa no dropdown
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.toggle('active', option.dataset.theme === this.currentTheme);
            });
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // Métodos para integração com outros componentes
    isDarkMode() {
        if (this.currentTheme === 'auto') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return this.currentTheme === 'dark';
    }

    getThemeColors() {
        if (this.currentTheme === 'auto') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            return this.themes[prefersDark ? 'dark' : 'light'].colors;
        }
        return this.themes[this.currentTheme].colors;
    }
}

// Inicializar gerenciador de temas
let themeManager;
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});

// Exportar para uso global
window.ThemeManager = ThemeManager;
