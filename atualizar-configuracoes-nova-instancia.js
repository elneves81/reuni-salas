// ==================== ATUALIZAR CONFIGURAÇÕES COM NOVA INSTÂNCIA ====================

const fs = require('fs');
const path = require('path');

class AtualizarConfiguracoes {
    constructor() {
        this.novoIP = ''; // Você vai inserir o IP da nova instância aqui
        this.novaSenha = 'Neves2025@';
        this.novoHost = '';
        this.arquivosParaAtualizar = [
            'netlify/functions/db-utils.js',
            'setup/database.js',
            'diagnosticar-banco.js',
            'testar-credenciais-banco.js',
            'testar-sistema-completo.js',
            'verificar-estrutura-bookings.js',
            'corrigir-banco.js',
            'consultar-dados.js',
            'migrar-localStorage-para-banco.js',
            'autorizar-ip-banco.js'
        ];
    }

    async executar() {
        console.log('🔧 ATUALIZANDO CONFIGURAÇÕES COM NOVA INSTÂNCIA');
        console.log('=' .repeat(60));

        // 1. Solicitar informações da nova instância
        await this.coletarInformacoes();

        // 2. Atualizar todos os arquivos
        this.atualizarArquivos();

        // 3. Criar arquivo de teste específico
        this.criarTesteNovaInstancia();

        console.log('\n✅ CONFIGURAÇÕES ATUALIZADAS!');
        console.log('\n🧪 Próximos passos:');
        console.log('1. Execute: node testar-nova-instancia.js');
        console.log('2. Se funcionar, execute: node testar-sistema-completo.js');
        console.log('3. Depois faça deploy no Netlify');
    }

    async coletarInformacoes() {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('📝 Por favor, forneça as informações da nova instância:\n');

        return new Promise((resolve) => {
            readline.question('🌐 IP Público da nova instância (ex: 34.123.45.67): ', (ip) => {
                this.novoIP = ip.trim();
                this.novoHost = ip.trim();
                
                console.log(`\n✅ Configurações definidas:`);
                console.log(`   IP: ${this.novoIP}`);
                console.log(`   Senha: ${this.novaSenha}`);
                console.log(`   Database: reuni-dep`);
                
                readline.close();
                resolve();
            });
        });
    }

    atualizarArquivos() {
        console.log('\n🔄 Atualizando arquivos de configuração...');

        this.arquivosParaAtualizar.forEach(arquivo => {
            const caminhoCompleto = path.join(__dirname, arquivo);
            
            if (fs.existsSync(caminhoCompleto)) {
                try {
                    let conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
                    
                    // Substituir IPs antigos
                    conteudo = conteudo.replace(/host:\s*['"`][\d\.]+['"`]/g, `host: '${this.novoIP}'`);
                    conteudo = conteudo.replace(/DB_HOST=[\d\.]+/g, `DB_HOST=${this.novoIP}`);
                    
                    // Substituir host genérico
                    conteudo = conteudo.replace(/host:\s*['"`]34\.45\.56\.79['"`]/g, `host: '${this.novoIP}'`);
                    conteudo = conteudo.replace(/host:\s*['"`]localhost['"`]/g, `host: '${this.novoIP}'`);
                    
                    // Garantir senha correta
                    conteudo = conteudo.replace(/password:\s*['"`][^'"`]*['"`]/g, `password: '${this.novaSenha}'`);
                    conteudo = conteudo.replace(/DB_PASSWORD=[^\s]*/g, `DB_PASSWORD=${this.novaSenha}`);
                    
                    // Salvar arquivo atualizado
                    fs.writeFileSync(caminhoCompleto, conteudo);
                    console.log(`   ✅ ${arquivo}`);
                    
                } catch (error) {
                    console.log(`   ❌ ${arquivo} - Erro: ${error.message}`);
                }
            } else {
                console.log(`   ⚠️  ${arquivo} - Arquivo não encontrado`);
            }
        });
    }

    criarTesteNovaInstancia() {
        const scriptTeste = `// ==================== TESTE DA NOVA INSTÂNCIA GOOGLE CLOUD ====================

const mysql = require('mysql2/promise');

async function testarNovaInstancia() {
    console.log('🧪 TESTANDO NOVA INSTÂNCIA DO GOOGLE CLOUD SQL');
    console.log('=' .repeat(60));
    
    const config = {
        host: '${this.novoIP}',
        user: 'root',
        password: '${this.novaSenha}',
        database: 'reuni-dep',
        port: 3306,
        ssl: {
            rejectUnauthorized: false
        },
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
    };

    console.log('📋 Configurações:');
    console.log(\`   Host: \${config.host}\`);
    console.log(\`   User: \${config.user}\`);
    console.log(\`   Database: \${config.database}\`);
    console.log(\`   Port: \${config.port}\`);

    try {
        console.log('\\n1. 🔌 Testando conexão...');
        const connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida!');

        console.log('\\n2. 📊 Verificando tabelas...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(\`✅ Tabelas encontradas: \${tables.length}\`);
        tables.forEach(table => console.log(\`   - \${Object.values(table)[0]}\`));

        console.log('\\n3. 🏢 Testando tabela de salas...');
        const [rooms] = await connection.query('SELECT COUNT(*) as total FROM rooms');
        console.log(\`✅ Salas cadastradas: \${rooms[0].total}\`);

        console.log('\\n4. 👥 Testando tabela de usuários...');
        const [users] = await connection.query('SELECT COUNT(*) as total FROM users');
        console.log(\`✅ Usuários cadastrados: \${users[0].total}\`);

        console.log('\\n5. 📅 Testando tabela de reservas...');
        const [bookings] = await connection.query('SELECT COUNT(*) as total FROM bookings');
        console.log(\`✅ Reservas cadastradas: \${bookings[0].total}\`);

        await connection.end();
        
        console.log('\\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('✅ A nova instância está funcionando perfeitamente!');
        console.log('\\n🚀 Próximo passo: Execute o sistema completo');
        
        return true;

    } catch (error) {
        console.error('\\n❌ ERRO NO TESTE:', error.message);
        console.log('\\n🛠️  POSSÍVEIS SOLUÇÕES:');
        console.log('1. Verificar se o IP está autorizado no Google Cloud');
        console.log('2. Confirmar se a instância está rodando');
        console.log('3. Verificar se as tabelas foram criadas');
        console.log('4. Testar conectividade de rede');
        
        return false;
    }
}

        fs.writeFileSync(path.join(__dirname, 'testar-nova-instancia.js'), scriptTeste);
        console.log('\n📝 Arquivo criado: testar-nova-instancia.js');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const atualizador = new AtualizarConfiguracoes();
    atualizador.executar().catch(console.error);
}

module.exports = AtualizarConfiguracoes;
`;

        fs.writeFileSync(path.join(__dirname, 'testar-nova-instancia.js'), scriptTeste);
        console.log('\n📝 Arquivo criado: testar-nova-instancia.js');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const atualizador = new AtualizarConfiguracoes();
    atualizador.executar().catch(console.error);
}

module.exports = AtualizarConfiguracoes;
