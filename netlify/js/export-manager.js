// ==================== SISTEMA DE EXPORTAÇÃO ====================

class ExportManager {
    constructor() {
        this.exportFormats = ['CSV', 'PDF', 'EXCEL', 'JSON'];
        this.init();
    }

    init() {
        this.createExportModal();
        this.setupEventListeners();
    }

    createExportModal() {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content export-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-download"></i>
                        Exportar Dados
                    </h3>
                    <button class="close-btn" onclick="exportManager.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="export-section">
                            <h4>Tipo de Dados</h4>
                            <div class="export-types">
                                <label class="export-type-option">
                                    <input type="radio" name="dataType" value="reservations" checked>
                                    <div class="option-content">
                                        <i class="fas fa-calendar-check"></i>
                                        <span>Reservas</span>
                                    </div>
                                </label>
                                <label class="export-type-option">
                                    <input type="radio" name="dataType" value="users">
                                    <div class="option-content">
                                        <i class="fas fa-users"></i>
                                        <span>Usuários</span>
                                    </div>
                                </label>
                                <label class="export-type-option">
                                    <input type="radio" name="dataType" value="rooms">
                                    <div class="option-content">
                                        <i class="fas fa-door-open"></i>
                                        <span>Salas</span>
                                    </div>
                                </label>
                                <label class="export-type-option">
                                    <input type="radio" name="dataType" value="reports">
                                    <div class="option-content">
                                        <i class="fas fa-chart-bar"></i>
                                        <span>Relatórios</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>Formato</h4>
                            <div class="export-formats">
                                <label class="export-format-option">
                                    <input type="radio" name="format" value="csv" checked>
                                    <div class="option-content">
                                        <i class="fas fa-file-csv"></i>
                                        <span>CSV</span>
                                    </div>
                                </label>
                                <label class="export-format-option">
                                    <input type="radio" name="format" value="pdf">
                                    <div class="option-content">
                                        <i class="fas fa-file-pdf"></i>
                                        <span>PDF</span>
                                    </div>
                                </label>
                                <label class="export-format-option">
                                    <input type="radio" name="format" value="excel">
                                    <div class="option-content">
                                        <i class="fas fa-file-excel"></i>
                                        <span>Excel</span>
                                    </div>
                                </label>
                                <label class="export-format-option">
                                    <input type="radio" name="format" value="json">
                                    <div class="option-content">
                                        <i class="fas fa-file-code"></i>
                                        <span>JSON</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>Período</h4>
                            <div class="date-range">
                                <div class="date-input-group">
                                    <label>Data Inicial</label>
                                    <input type="date" id="exportStartDate" value="${this.getDefaultStartDate()}">
                                </div>
                                <div class="date-input-group">
                                    <label>Data Final</label>
                                    <input type="date" id="exportEndDate" value="${this.getDefaultEndDate()}">
                                </div>
                            </div>
                            <div class="quick-periods">
                                <button class="quick-period-btn" onclick="exportManager.setQuickPeriod('week')">Última Semana</button>
                                <button class="quick-period-btn" onclick="exportManager.setQuickPeriod('month')">Último Mês</button>
                                <button class="quick-period-btn" onclick="exportManager.setQuickPeriod('quarter')">Último Trimestre</button>
                                <button class="quick-period-btn" onclick="exportManager.setQuickPeriod('year')">Último Ano</button>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>Opções Avançadas</h4>
                            <div class="advanced-options">
                                <label class="checkbox-option">
                                    <input type="checkbox" id="includeHeaders" checked>
                                    <span>Incluir cabeçalhos</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="includeTimestamp" checked>
                                    <span>Incluir timestamp</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="compressFile">
                                    <span>Comprimir arquivo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="exportManager.closeModal()">Cancelar</button>
                    <button class="btn-primary" onclick="exportManager.executeExport()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Botões de exportação em cada seção
        this.addExportButtons();
    }

    addExportButtons() {
        const sections = [
            { id: 'reservationsSection', type: 'reservations' },
            { id: 'usersSection', type: 'users' },
            { id: 'roomsSection', type: 'rooms' },
            { id: 'reportsSection', type: 'reports' }
        ];

        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) {
                const header = element.querySelector('.section-header, .card-header');
                if (header && !header.querySelector('.export-btn')) {
                    const exportBtn = document.createElement('button');
                    exportBtn.className = 'export-btn';
                    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
                    exportBtn.title = 'Exportar dados';
                    exportBtn.onclick = () => this.openModal(section.type);
                    header.appendChild(exportBtn);
                }
            }
        });
    }

    openModal(dataType = 'reservations') {
        const modal = document.getElementById('exportModal');
        modal.style.display = 'flex';
        
        // Selecionar tipo de dados
        const dataTypeRadio = document.querySelector(`input[name="dataType"][value="${dataType}"]`);
        if (dataTypeRadio) {
            dataTypeRadio.checked = true;
        }
    }

    closeModal() {
        const modal = document.getElementById('exportModal');
        modal.style.display = 'none';
    }

    setQuickPeriod(period) {
        const endDate = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }

        document.getElementById('exportStartDate').value = this.formatDate(startDate);
        document.getElementById('exportEndDate').value = this.formatDate(endDate);
    }

    getDefaultStartDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return this.formatDate(date);
    }

    getDefaultEndDate() {
        return this.formatDate(new Date());
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    async executeExport() {
        const dataType = document.querySelector('input[name="dataType"]:checked').value;
        const format = document.querySelector('input[name="format"]:checked').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        const includeHeaders = document.getElementById('includeHeaders').checked;
        const includeTimestamp = document.getElementById('includeTimestamp').checked;
        const compressFile = document.getElementById('compressFile').checked;

        // Mostrar loading
        this.showExportProgress();

        try {
            const data = await this.getData(dataType, startDate, endDate);
            
            switch (format) {
                case 'csv':
                    this.exportToCSV(data, dataType, includeHeaders);
                    break;
                case 'pdf':
                    this.exportToPDF(data, dataType, includeHeaders);
                    break;
                case 'excel':
                    this.exportToExcel(data, dataType, includeHeaders);
                    break;
                case 'json':
                    this.exportToJSON(data, dataType, includeTimestamp);
                    break;
            }

            this.closeModal();
            this.showExportSuccess();
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            this.showExportError();
        }
    }

    async getData(dataType, startDate, endDate) {
        // Simular dados para demonstração
        const baseData = {
            reservations: [
                { id: 1, sala: 'Sala A', usuario: 'João Silva', data: '2024-01-15', horario: '09:00-10:00', status: 'Confirmado' },
                { id: 2, sala: 'Sala B', usuario: 'Maria Santos', data: '2024-01-16', horario: '14:00-15:00', status: 'Pendente' },
                { id: 3, sala: 'Sala C', usuario: 'Pedro Costa', data: '2024-01-17', horario: '11:00-12:00', status: 'Cancelado' }
            ],
            users: [
                { id: 1, nome: 'João Silva', email: 'joao@empresa.com', departamento: 'TI', cargo: 'Desenvolvedor' },
                { id: 2, nome: 'Maria Santos', email: 'maria@empresa.com', departamento: 'RH', cargo: 'Analista' },
                { id: 3, nome: 'Pedro Costa', email: 'pedro@empresa.com', departamento: 'Vendas', cargo: 'Gerente' }
            ],
            rooms: [
                { id: 1, nome: 'Sala A', capacidade: 10, equipamentos: 'Projetor, Tela', status: 'Disponível' },
                { id: 2, nome: 'Sala B', capacidade: 6, equipamentos: 'TV, Quadro', status: 'Ocupada' },
                { id: 3, nome: 'Sala C', capacidade: 20, equipamentos: 'Projetor, Som', status: 'Manutenção' }
            ],
            reports: [
                { periodo: 'Janeiro 2024', total_reservas: 45, taxa_ocupacao: '78%', sala_mais_usada: 'Sala A' },
                { periodo: 'Dezembro 2023', total_reservas: 52, taxa_ocupacao: '82%', sala_mais_usada: 'Sala B' },
                { periodo: 'Novembro 2023', total_reservas: 38, taxa_ocupacao: '65%', sala_mais_usada: 'Sala C' }
            ]
        };

        return baseData[dataType] || [];
    }

    exportToCSV(data, dataType, includeHeaders) {
        if (!data.length) return;

        let csv = '';
        
        if (includeHeaders) {
            csv = Object.keys(data[0]).join(',') + '\n';
        }
        
        csv += data.map(row => 
            Object.values(row).map(value => 
                typeof value === 'string' ? `"${value}"` : value
            ).join(',')
        ).join('\n');

        this.downloadFile(csv, `${dataType}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    exportToPDF(data, dataType, includeHeaders) {
        // Para demonstração, criar um HTML simples e imprimir
        const htmlContent = this.generateHTMLTable(data, dataType, includeHeaders);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório ${dataType}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Sala Livre - Relatório de ${dataType}</h1>
                        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                    ${htmlContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    exportToExcel(data, dataType, includeHeaders) {
        // Converter para CSV com separador de tab para Excel
        if (!data.length) return;

        let excel = '';
        
        if (includeHeaders) {
            excel = Object.keys(data[0]).join('\t') + '\n';
        }
        
        excel += data.map(row => 
            Object.values(row).join('\t')
        ).join('\n');

        this.downloadFile(excel, `${dataType}_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
    }

    exportToJSON(data, dataType, includeTimestamp) {
        const exportData = {
            type: dataType,
            exported_at: includeTimestamp ? new Date().toISOString() : undefined,
            count: data.length,
            data: data
        };

        const json = JSON.stringify(exportData, null, 2);
        this.downloadFile(json, `${dataType}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    generateHTMLTable(data, dataType, includeHeaders) {
        if (!data.length) return '<p>Nenhum dado encontrado</p>';

        let html = '<table>';
        
        if (includeHeaders) {
            html += '<thead><tr>';
            Object.keys(data[0]).forEach(key => {
                html += `<th>${key}</th>`;
            });
            html += '</tr></thead>';
        }
        
        html += '<tbody>';
        data.forEach(row => {
            html += '<tr>';
            Object.values(row).forEach(value => {
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        return html;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    showExportProgress() {
        // Mostrar indicador de progresso
        const button = document.querySelector('#exportModal .btn-primary');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
        button.disabled = true;
    }

    showExportSuccess() {
        if (window.notificationSystem) {
            notificationSystem.addNotification('success', 'Exportação Concluída', 'Arquivo baixado com sucesso!');
        }
    }

    showExportError() {
        if (window.notificationSystem) {
            notificationSystem.addNotification('error', 'Erro na Exportação', 'Falha ao gerar arquivo. Tente novamente.');
        }
    }
}

// Inicializar gerenciador de exportação
let exportManager;
document.addEventListener('DOMContentLoaded', () => {
    exportManager = new ExportManager();
});
