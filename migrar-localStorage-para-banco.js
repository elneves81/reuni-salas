// ==================== MIGRAÇÃO DE DADOS: localStorage → Google Cloud SQL ====================

class MigracaoLocalStorageParaBanco {
    constructor() {
        this.apiBaseURL = '/api';
        this.migracoesPendentes = [];
        this.migracoesConcluidas = [];
        this.erros = [];
    }

    async executarMigracao() {
        console.log('🚀 INICIANDO MIGRAÇÃO: localStorage → Google Cloud SQL');
        console.log('=' .repeat(60));

        try {
            // 1. Verificar dados no localStorage
            const dadosLocal = this.coletarDadosLocalStorage();
            
            if (!dadosLocal.temDados) {
                console.log('📭 Nenhum dado encontrado no localStorage para migrar');
                return { success: true, message: 'Nenhum dado para migrar' };
            }

            // 2. Verificar conectividade com banco
            await this.verificarConectividadeBanco();

            // 3. Migrar usuários
            if (dadosLocal.usuarios.length > 0) {
                await this.migrarUsuarios(dadosLocal.usuarios);
            }

            // 4. Migrar reuniões (eventos do calendário)
            if (dadosLocal.eventos.length > 0) {
                await this.migrarEventos(dadosLocal.eventos);
            }

            // 5. Migrar salas
            if (dadosLocal.salas.length > 0) {
                await this.migrarSalas(dadosLocal.salas);
            }

            // 6. Relatório final
            this.gerarRelatorioMigracao();

            return { 
                success: true, 
                migracoesConcluidas: this.migracoesConcluidas.length,
                erros: this.erros.length
            };

        } catch (error) {
            console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error);
            throw error;
        }
    }

    coletarDadosLocalStorage() {
        console.log('📦 Coletando dados do localStorage...');
        
        const dados = {
            usuarios: JSON.parse(localStorage.getItem('salalivre_users') || '[]'),
            eventos: JSON.parse(localStorage.getItem('calendar_events') || '[]'),
            salas: JSON.parse(localStorage.getItem('rooms') || '[]'),
            configuracoes: JSON.parse(localStorage.getItem('salalivre_config') || '{}'),
            userData: JSON.parse(localStorage.getItem('userData') || '{}')
        };

        dados.temDados = dados.usuarios.length > 0 || 
                         dados.eventos.length > 0 || 
                         dados.salas.length > 0;

        console.log(`👥 Usuários encontrados: ${dados.usuarios.length}`);
        console.log(`📅 Eventos encontrados: ${dados.eventos.length}`);
        console.log(`🏢 Salas encontradas: ${dados.salas.length}`);

        return dados;
    }

    async verificarConectividadeBanco() {
        console.log('🔌 Verificando conectividade com banco...');
        
        try {
            const response = await fetch(`${this.apiBaseURL}/health`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            console.log('✅ Conectividade com banco confirmada');
        } catch (error) {
            console.error('❌ Falha na conectividade:', error);
            throw new Error('Não foi possível conectar ao banco de dados');
        }
    }

    async migrarUsuarios(usuarios) {
        console.log(`👥 Migrando ${usuarios.length} usuários...`);

        for (const usuario of usuarios) {
            try {
                // Verificar se usuário já existe no banco
                const exists = await this.verificarUsuarioExiste(usuario.email);
                
                if (exists) {
                    console.log(`⚠️  Usuário ${usuario.email} já existe no banco`);
                    continue;
                }

                // Converter formato localStorage para API
                const usuarioAPI = this.converterUsuarioParaAPI(usuario);

                // Criar usuário no banco
                const response = await fetch(`${this.apiBaseURL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usuarioAPI)
                });

                if (response.ok) {
                    const novoUsuario = await response.json();
                    this.migracoesConcluidas.push({
                        tipo: 'usuario',
                        local: usuario,
                        banco: novoUsuario
                    });
                    console.log(`✅ Usuário migrado: ${usuario.name}`);
                } else {
                    throw new Error(`Erro ${response.status}: ${await response.text()}`);
                }

            } catch (error) {
                console.error(`❌ Erro ao migrar usuário ${usuario.name}:`, error);
                this.erros.push({
                    tipo: 'usuario',
                    item: usuario,
                    erro: error.message
                });
            }
        }
    }

    async migrarEventos(eventos) {
        console.log(`📅 Migrando ${eventos.length} eventos...`);

        for (const evento of eventos) {
            try {
                // Converter formato localStorage para API
                const eventoAPI = this.converterEventoParaAPI(evento);

                // Criar evento no banco
                const response = await fetch(`${this.apiBaseURL}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventoAPI)
                });

                if (response.ok) {
                    const novoEvento = await response.json();
                    this.migracoesConcluidas.push({
                        tipo: 'evento',
                        local: evento,
                        banco: novoEvento
                    });
                    console.log(`✅ Evento migrado: ${evento.title}`);
                } else {
                    throw new Error(`Erro ${response.status}: ${await response.text()}`);
                }

            } catch (error) {
                console.error(`❌ Erro ao migrar evento ${evento.title}:`, error);
                this.erros.push({
                    tipo: 'evento',
                    item: evento,
                    erro: error.message
                });
            }
        }
    }

    async migrarSalas(salas) {
        console.log(`🏢 Migrando ${salas.length} salas...`);

        for (const sala of salas) {
            try {
                // Verificar se sala já existe
                const exists = await this.verificarSalaExiste(sala.name);
                
                if (exists) {
                    console.log(`⚠️  Sala ${sala.name} já existe no banco`);
                    continue;
                }

                // Converter formato localStorage para API
                const salaAPI = this.converterSalaParaAPI(sala);

                // Criar sala no banco
                const response = await fetch(`${this.apiBaseURL}/rooms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(salaAPI)
                });

                if (response.ok) {
                    const novaSala = await response.json();
                    this.migracoesConcluidas.push({
                        tipo: 'sala',
                        local: sala,
                        banco: novaSala
                    });
                    console.log(`✅ Sala migrada: ${sala.name}`);
                } else {
                    throw new Error(`Erro ${response.status}: ${await response.text()}`);
                }

            } catch (error) {
                console.error(`❌ Erro ao migrar sala ${sala.name}:`, error);
                this.erros.push({
                    tipo: 'sala',
                    item: sala,
                    erro: error.message
                });
            }
        }
    }

    async verificarUsuarioExiste(email) {
        try {
            const response = await fetch(`${this.apiBaseURL}/users?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const users = await response.json();
                return users.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            return false;
        }
    }

    async verificarSalaExiste(nome) {
        try {
            const response = await fetch(`${this.apiBaseURL}/rooms`);
            if (response.ok) {
                const rooms = await response.json();
                return rooms.some(room => room.name === nome);
            }
            return false;
        } catch (error) {
            console.error('Erro ao verificar sala:', error);
            return false;
        }
    }

    converterUsuarioParaAPI(usuario) {
        return {
            name: usuario.name,
            email: usuario.email,
            password: usuario.password || 'temp123', // Senha temporária se não existir
            role: usuario.role || 'user',
            department: usuario.department || 'geral',
            status: usuario.status || 'active'
        };
    }

    converterEventoParaAPI(evento) {
        return {
            title: evento.title,
            description: evento.description || '',
            start_time: evento.start || evento.startStr,
            end_time: evento.end || evento.endStr,
            room_id: 1, // Sala padrão - ajustar conforme necessário
            user_id: 1, // Usuário padrão - ajustar conforme necessário
            status: 'confirmed'
        };
    }

    converterSalaParaAPI(sala) {
        return {
            name: sala.name,
            description: sala.description || '',
            capacity: sala.capacity || 10,
            location: sala.location || '',
            equipment: JSON.stringify(sala.equipment || []),
            status: sala.status || 'active'
        };
    }

    gerarRelatorioMigracao() {
        console.log('\n📊 RELATÓRIO DE MIGRAÇÃO');
        console.log('=' .repeat(40));
        console.log(`✅ Migradas com sucesso: ${this.migracoesConcluidas.length}`);
        console.log(`❌ Falhas: ${this.erros.length}`);
        
        if (this.migracoesConcluidas.length > 0) {
            console.log('\n✅ MIGRADAS COM SUCESSO:');
            this.migracoesConcluidas.forEach(item => {
                console.log(`- ${item.tipo}: ${item.local.name || item.local.title || item.local.email}`);
            });
        }

        if (this.erros.length > 0) {
            console.log('\n❌ FALHAS:');
            this.erros.forEach(erro => {
                console.log(`- ${erro.tipo}: ${erro.item.name || erro.item.title || erro.item.email} - ${erro.erro}`);
            });
        }

        // Criar backup do localStorage antes da limpeza
        this.criarBackupLocalStorage();
    }

    criarBackupLocalStorage() {
        const backup = {
            timestamp: new Date().toISOString(),
            dados: {
                usuarios: JSON.parse(localStorage.getItem('salalivre_users') || '[]'),
                eventos: JSON.parse(localStorage.getItem('calendar_events') || '[]'),
                salas: JSON.parse(localStorage.getItem('rooms') || '[]'),
                configuracoes: JSON.parse(localStorage.getItem('salalivre_config') || '{}'),
                userData: JSON.parse(localStorage.getItem('userData') || '{}')
            }
        };

        // Salvar backup
        localStorage.setItem('salalivre_backup_pre_migracao', JSON.stringify(backup));
        console.log('💾 Backup do localStorage criado: salalivre_backup_pre_migracao');
    }

    async limparLocalStorageAposMigracao() {
        console.log('🧹 Limpando localStorage após migração...');
        
        const chaves = [
            'salalivre_users',
            'calendar_events', 
            'rooms',
            'salalivre_config'
        ];

        chaves.forEach(chave => {
            localStorage.removeItem(chave);
            console.log(`🗑️  Removido: ${chave}`);
        });

        console.log('✅ localStorage limpo - sistema agora usa apenas banco de dados');
    }
}

// Executar migração se chamado diretamente
if (typeof window !== 'undefined') {
    window.migracaoParaBanco = new MigracaoLocalStorageParaBanco();
    
    // Função global para executar migração
    window.executarMigracao = async function() {
        try {
            const resultado = await window.migracaoParaBanco.executarMigracao();
            console.log('🎉 MIGRAÇÃO CONCLUÍDA!', resultado);
            
            // Perguntar se quer limpar localStorage
            if (confirm('Migração concluída! Deseja limpar o localStorage agora?')) {
                await window.migracaoParaBanco.limparLocalStorageAposMigracao();
                alert('Sistema migrado com sucesso! Recarregue a página.');
            }
            
            return resultado;
        } catch (error) {
            console.error('💥 ERRO NA MIGRAÇÃO:', error);
            alert(`Erro na migração: ${error.message}`);
            throw error;
        }
    };
}

// Uso: executarMigracao() no console do navegador
console.log('📋 Script de migração carregado. Execute: executarMigracao()');
