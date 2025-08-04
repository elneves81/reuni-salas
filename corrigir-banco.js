// ==================== CORRIGIR BANCO DE DADOS - GOOGLE CLOUD SQL ====================

const { execSync } = require('child_process');

async function corrigirBanco() {
    console.log('🔧 === CORRIGINDO CONFIGURAÇÃO DO BANCO ===\n');
    
    try {
        // 1. Verificar se gcloud está instalado
        console.log('1. 📦 Verificando Google Cloud CLI...');
        try {
            const gcloudVersion = execSync('gcloud version', { encoding: 'utf8' });
            console.log('✅ Google Cloud CLI encontrado');
        } catch (error) {
            console.log('❌ Google Cloud CLI não encontrado');
            console.log('💡 Instale: https://cloud.google.com/sdk/docs/install');
            return;
        }

        // 2. Verificar projeto ativo
        console.log('\n2. 🏗️ Verificando projeto ativo...');
        try {
            const activeProject = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
            console.log(`✅ Projeto ativo: ${activeProject}`);
        } catch (error) {
            console.log('❌ Nenhum projeto ativo');
            console.log('💡 Configure: gcloud auth login && gcloud config set project SEU_PROJETO');
            return;
        }

        // 3. Listar instâncias Cloud SQL
        console.log('\n3. 🗄️ Listando instâncias Cloud SQL...');
        try {
            const instances = execSync('gcloud sql instances list --format="table(name,region,databaseVersion,tier)"', { encoding: 'utf8' });
            console.log(instances);
        } catch (error) {
            console.log('❌ Erro ao listar instâncias:', error.message);
        }

        // 4. Verificar IP autorizado
        console.log('\n4. 🌐 Verificando IPs autorizados...');
        try {
            const authorizedNetworks = execSync('gcloud sql instances describe sala-livre-instance --format="value(settings.ipConfiguration.authorizedNetworks[].value)"', { encoding: 'utf8' });
            console.log('📋 IPs autorizados:', authorizedNetworks || 'Nenhum');
        } catch (error) {
            console.log('❌ Erro ao verificar IPs:', error.message);
        }

        // 5. Resetar senha do usuário root
        console.log('\n5. 🔑 Resetando senha root...');
        try {
            const novaSenha = 'Neves2025@';
            execSync(`gcloud sql users set-password root --host=% --instance=sala-livre-instance --password="${novaSenha}"`, { encoding: 'utf8' });
            console.log('✅ Senha root resetada para: Neves2025@');
        } catch (error) {
            console.log('❌ Erro ao resetar senha:', error.message);
        }

        // 6. Criar usuário dedicado
        console.log('\n6. 👤 Criando usuário app_user...');
        try {
            const userPassword = 'AppUser2025!';
            execSync(`gcloud sql users create app_user --host=% --instance=sala-livre-instance --password="${userPassword}"`, { encoding: 'utf8' });
            console.log('✅ Usuário app_user criado com senha: AppUser2025!');
        } catch (error) {
            console.log('⚠️ Usuário app_user já existe ou erro:', error.message);
        }

        // 7. Autorizar IP atual
        console.log('\n7. 🔓 Autorizando IP atual...');
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const { ip } = await response.json();
            console.log(`📍 Seu IP atual: ${ip}`);
            
            execSync(`gcloud sql instances patch sala-livre-instance --authorized-networks="${ip}/32"`, { encoding: 'utf8' });
            console.log(`✅ IP ${ip} autorizado`);
        } catch (error) {
            console.log('❌ Erro ao autorizar IP:', error.message);
        }

        // 8. Obter IP da instância
        console.log('\n8. 📍 Obtendo IP da instância...');
        try {
            const instanceIP = execSync('gcloud sql instances describe sala-livre-instance --format="value(ipAddresses[0].ipAddress)"', { encoding: 'utf8' }).trim();
            console.log(`✅ IP da instância: ${instanceIP}`);
        } catch (error) {
            console.log('❌ Erro ao obter IP:', error.message);
        }

        console.log('\n🎉 === CONFIGURAÇÃO CONCLUÍDA ===');
        console.log('📋 Resumo das credenciais:');
        console.log('- Host: 35.184.206.243 (ou o IP mostrado acima)');
        console.log('- User: root');
        console.log('- Password: Neves2025@');
        console.log('- Database: reuni-dep');
        console.log('\n💡 Agora teste a conexão novamente!');

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    corrigirBanco();
}

module.exports = { corrigirBanco };
