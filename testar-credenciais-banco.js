// ==================== TESTE AVANÇADO DE CREDENCIAIS ====================

const mysql = require('mysql2/promise');

class TesteCredenciais {
    constructor() {
        this.host = '35.184.206.243';
        this.port = 3306;
        
        // Lista de possíveis senhas para testar
        this.senhasPossiveis = [
            'SalasSegura2024!',
            'reuni-dep_2024',
            'salalivre123',
            'admin123',
            'password',
            '123456',
            'root',
            'admin',
            'sala123',
            'google123',
            'cloud123',
            '', // senha vazia
            'reunipro123',
            'reunipro2024',
            'Reunipro@2024'
        ];

        // Lista de possíveis usuários
        this.usuariosPossiveis = [
            'root',
            'app_user',
            'admin',
            'salalivre',
            'user',
            'mysql',
            'reunipro'
        ];
    }

    async testarTodasCombinacoes() {
        console.log('🔐 === TESTE EXTENSIVO DE CREDENCIAIS ===\n');
        console.log(`🎯 Host: ${this.host}:${this.port}`);
        console.log(`👥 Usuários: ${this.usuariosPossiveis.length}`);
        console.log(`🔑 Senhas: ${this.senhasPossiveis.length}`);
        console.log(`🧪 Total de combinações: ${this.usuariosPossiveis.length * this.senhasPossiveis.length}\n`);

        let tentativa = 0;
        const totalTentativas = this.usuariosPossiveis.length * this.senhasPossiveis.length;

        for (const usuario of this.usuariosPossiveis) {
            for (const senha of this.senhasPossiveis) {
                tentativa++;
                console.log(`🧪 [${tentativa}/${totalTentativas}] Testando: ${usuario} / ${senha || '(vazia)'}`);

                try {
                    const conexao = await mysql.createConnection({
                        host: this.host,
                        port: this.port,
                        user: usuario,
                        password: senha,
                        connectTimeout: 5000
                    });

                    // Se chegou aqui, a conexão funcionou!
                    console.log('🎉 *** CREDENCIAIS FUNCIONANDO! ***');
                    console.log(`✅ Usuário: ${usuario}`);
                    console.log(`✅ Senha: ${senha || '(vazia)'}`);

                    // Testar comandos básicos
                    await this.testarConexao(conexao, usuario, senha);
                    await conexao.end();

                    return { usuario, senha, funcionou: true };

                } catch (error) {
                    // Erro esperado, continuar
                    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                        console.log('   ❌ Acesso negado');
                    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
                        console.log('   ⏰ Timeout/Conexão recusada');
                    } else {
                        console.log(`   ❓ Erro: ${error.code || error.message.substring(0, 50)}`);
                    }
                }

                // Pequena pausa para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('\n💥 NENHUMA COMBINAÇÃO FUNCIONOU!');
        return { funcionou: false };
    }

    async testarConexao(conexao, usuario, senha) {
        try {
            // Teste básico
            const [teste] = await conexao.execute('SELECT 1 as test, NOW() as agora');
            console.log(`   ✅ Comando SELECT funcionando: ${teste[0].test} - ${teste[0].agora}`);

            // Listar bancos
            const [bancos] = await conexao.execute('SHOW DATABASES');
            console.log(`   📋 Bancos disponíveis: ${bancos.map(b => b.Database).join(', ')}`);

            // Verificar permissões
            const [privilegios] = await conexao.execute('SHOW GRANTS');
            console.log(`   🔐 Privilégios: ${privilegios.length} grants encontrados`);

            return true;

        } catch (error) {
            console.log(`   ⚠️ Erro nos testes: ${error.message.substring(0, 100)}`);
            return false;
        }
    }

    async verificarStatusGoogleCloud() {
        console.log('\n🌐 === VERIFICAÇÃO DO GOOGLE CLOUD ===\n');
        
        // Teste de conectividade geral
        console.log('🔍 Testando conectividade geral...');
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // Ping para o servidor
            const pingResult = await execAsync(`ping -n 4 ${this.host}`);
            console.log('✅ Servidor responde ao ping');

            // Teste de porta
            const net = require('net');
            const testePorta = await new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });
                
                socket.on('error', () => {
                    resolve(false);
                });
                
                socket.connect(this.port, this.host);
            });

            if (testePorta) {
                console.log(`✅ Porta ${this.port} está aberta`);
            } else {
                console.log(`❌ Porta ${this.port} está fechada ou inacessível`);
            }

        } catch (error) {
            console.log(`⚠️ Erro na verificação: ${error.message}`);
        }
    }

    gerarScriptCorrecao(credenciais) {
        if (!credenciais.funcionou) {
            console.log('\n🆘 === SOLUÇÕES RECOMENDADAS ===');
            console.log('');
            console.log('1. 🔍 VERIFICAR INSTÂNCIA GOOGLE CLOUD:');
            console.log('   gcloud sql instances list');
            console.log('   gcloud sql instances describe sala-livre-db');
            console.log('');
            console.log('2. 🔐 RESETAR SENHA ROOT:');
            console.log('   gcloud sql users set-password root --instance=sala-livre-db --password=NovaSenha123!');
            console.log('');
            console.log('3. 👤 CRIAR NOVO USUÁRIO:');
            console.log('   gcloud sql users create reunipro --instance=sala-livre-db --password=Reunipro2024!');
            console.log('');
            console.log('4. 🌐 VERIFICAR REDES AUTORIZADAS:');
            console.log('   gcloud sql instances patch sala-livre-db --authorized-networks=0.0.0.0/0');
            console.log('');
            console.log('5. 🔄 REINICIAR INSTÂNCIA:');
            console.log('   gcloud sql instances restart sala-livre-db');
            return;
        }

        console.log('\n📝 === ATUALIZANDO CONFIGURAÇÕES ===');
        const configCorreta = `
// Configuração funcionando
const dbConfig = {
    host: '${this.host}',
    user: '${credenciais.usuario}',
    password: '${credenciais.senha}',
    database: 'reuni-dep',
    port: ${this.port}
};`;
        
        console.log(configCorreta);
    }
}

// Executar teste
async function executarTeste() {
    const teste = new TesteCredenciais();
    
    try {
        // Verificar conectividade geral
        await teste.verificarStatusGoogleCloud();
        
        // Testar credenciais
        const resultado = await teste.testarTodasCombinacoes();
        
        // Gerar soluções
        teste.gerarScriptCorrecao(resultado);
        
    } catch (error) {
        console.error('💥 Erro no teste:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarTeste();
}

module.exports = TesteCredenciais;
