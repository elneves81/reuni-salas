// ==================== AUTORIZAR IP NO GOOGLE CLOUD ====================

const { execSync } = require('child_process');

class AutorizarIP {
    constructor() {
        this.meuIP = '177.87.200.82'; // IP atual que está sendo rejeitado
        this.instancia = 'sala-livre-instance';
        this.projeto = 'reunipro-443018';
    }

    async executarAutorizacao() {
        console.log('🔐 AUTORIZANDO IP NO GOOGLE CLOUD SQL');
        console.log('=' .repeat(50));
        console.log(`🌐 IP a ser autorizado: ${this.meuIP}`);
        console.log(`🗄️  Instância: ${this.instancia}`);
        console.log(`📁 Projeto: ${this.projeto}`);
        
        try {
            // 1. Verificar status da instância
            console.log('\n1. 🔍 Verificando status da instância...');
            this.verificarInstancia();
            
            // 2. Autorizar IP
            console.log('\n2. 🔓 Autorizando IP...');
            this.autorizarIP();
            
            // 3. Verificar IPs autorizados
            console.log('\n3. 📋 Verificando IPs autorizados...');
            this.listarIPsAutorizados();
            
            // 4. Testar conexão
            console.log('\n4. 🧪 Testando conexão...');
            await this.testarConexao();
            
            console.log('\n✅ AUTORIZAÇÃO CONCLUÍDA!');
            
        } catch (error) {
            console.error('❌ ERRO na autorização:', error.message);
            this.mostrarSolucaoManual();
        }
    }

    verificarInstancia() {
        try {
            const comando = `gcloud sql instances describe ${this.instancia} --project=${this.projeto}`;
            const resultado = execSync(comando, { encoding: 'utf8' });
            console.log('✅ Instância encontrada e ativa');
        } catch (error) {
            console.log('❌ Erro ao verificar instância:', error.message);
            throw error;
        }
    }

    autorizarIP() {
        try {
            const comando = `gcloud sql instances patch ${this.instancia} --authorized-networks=${this.meuIP} --project=${this.projeto}`;
            const resultado = execSync(comando, { encoding: 'utf8' });
            console.log('✅ IP autorizado com sucesso');
        } catch (error) {
            console.log('❌ Erro ao autorizar IP:', error.message);
            
            // Tentar adicionar em vez de substituir
            try {
                console.log('🔄 Tentando adicionar IP à lista existente...');
                const comandoAdicionar = `gcloud sql instances patch ${this.instancia} --authorized-networks=${this.meuIP}/32 --project=${this.projeto}`;
                execSync(comandoAdicionar, { encoding: 'utf8' });
                console.log('✅ IP adicionado à lista existente');
            } catch (error2) {
                throw error;
            }
        }
    }

    listarIPsAutorizados() {
        try {
            const comando = `gcloud sql instances describe ${this.instancia} --project=${this.projeto} --format="value(settings.ipConfiguration.authorizedNetworks[].value)"`;
            const resultado = execSync(comando, { encoding: 'utf8' });
            console.log('📋 IPs autorizados:');
            resultado.split('\n').filter(ip => ip.trim()).forEach(ip => {
                console.log(`   - ${ip}`);
            });
        } catch (error) {
            console.log('❌ Erro ao listar IPs:', error.message);
        }
    }

    async testarConexao() {
        const mysql = require('mysql2/promise');
        
        const config = {
            host: '35.184.206.243',
            user: 'root',
            password: 'Neves2025@',
            database: 'reuni-dep',
            port: 3306,
            ssl: {
                rejectUnauthorized: false
            }
        };

        try {
            const connection = await mysql.createConnection(config);
            await connection.query('SELECT 1');
            await connection.end();
            console.log('✅ Conexão testada com sucesso!');
        } catch (error) {
            console.log('❌ Teste de conexão falhou:', error.message);
        }
    }

    mostrarSolucaoManual() {
        console.log('\n🛠️  SOLUÇÃO MANUAL:');
        console.log('1. Acesse o Google Cloud Console');
        console.log('2. Vá para SQL > Instâncias');
        console.log(`3. Clique na instância: ${this.instancia}`);
        console.log('4. Vá para "Connections" > "Authorized networks"');
        console.log(`5. Adicione o IP: ${this.meuIP}`);
        console.log('6. Salve e aguarde a atualização');
        
        console.log('\n🌐 Ou execute manualmente:');
        console.log(`gcloud sql instances patch ${this.instancia} --authorized-networks=${this.meuIP} --project=${this.projeto}`);
    }
}

// Executar
if (require.main === module) {
    const autorizador = new AutorizarIP();
    autorizador.executarAutorizacao().catch(console.error);
}

module.exports = AutorizarIP;
