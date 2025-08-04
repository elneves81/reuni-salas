// ==================== ATUALIZAR TODOS OS ARQUIVOS PARA NOVA INSTÂNCIA ====================

const fs = require('fs');
const path = require('path');

class AtualizarTodosArquivos {
    constructor() {
        this.novaConfiguracao = {
            host: '35.184.206.243',
            password: 'Neves2025@',
            database: 'reuni-dep'
        };
        
        this.arquivosParaAtualizar = [
            'netlify/functions/register.js',
            'teste-conexao-direta.js',
            'teste-root-user.js',
            'diagnosticar-banco.js',
            'testar-credenciais-banco.js',
            'autorizar-ip-banco.js',
            'atualizar-configuracoes-nova-instancia.js',
            'testar-sistema-completo.js',
            'verificar-estrutura-bookings.js',
            'corrigir-banco.js',
            'consultar-dados.js',
            'migrar-localStorage-para-banco.js'
        ];
    }

    async executar() {
        console.log('🔧 ATUALIZANDO TODOS OS ARQUIVOS PARA NOVA INSTÂNCIA');
        console.log('=' .repeat(60));
        console.log(`🌐 Nova configuração:`);
        console.log(`   Host: ${this.novaConfiguracao.host}`);
        console.log(`   Database: ${this.novaConfiguracao.database}`);
        console.log(`   Password: ${this.novaConfiguracao.password}`);

        let atualizados = 0;
        let erros = 0;

        for (const arquivo of this.arquivosParaAtualizar) {
            const caminhoCompleto = path.join(__dirname, arquivo);
            
            if (fs.existsSync(caminhoCompleto)) {
                try {
                    let conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
                    let modificado = false;
                    
                    // Substituir hosts antigos
                    if (conteudo.includes('34.45.56.79')) {
                        conteudo = conteudo.replace(/34\.45\.56\.79/g, this.novaConfiguracao.host);
                        modificado = true;
                    }
                    
                    // Substituir senhas antigas
                    if (conteudo.includes('Elber@2025')) {
                        conteudo = conteudo.replace(/Elber@2025/g, this.novaConfiguracao.password);
                        modificado = true;
                    }
                    
                    // Substituir banco antigo
                    if (conteudo.includes('sala_livre')) {
                        conteudo = conteudo.replace(/sala_livre/g, this.novaConfiguracao.database);
                        modificado = true;
                    }
                    
                    // Salvar se houve modificações
                    if (modificado) {
                        fs.writeFileSync(caminhoCompleto, conteudo);
                        console.log(`   ✅ ${arquivo}`);
                        atualizados++;
                    } else {
                        console.log(`   ⚪ ${arquivo} (já atualizado)`);
                    }
                    
                } catch (error) {
                    console.log(`   ❌ ${arquivo} - Erro: ${error.message}`);
                    erros++;
                }
            } else {
                console.log(`   ⚠️  ${arquivo} - Arquivo não encontrado`);
            }
        }

        console.log(`\n📊 RESULTADO:`);
        console.log(`   ✅ Arquivos atualizados: ${atualizados}`);
        console.log(`   ❌ Erros: ${erros}`);
        console.log(`   📁 Total processados: ${this.arquivosParaAtualizar.length}`);

        if (erros === 0) {
            console.log('\n🎉 TODOS OS ARQUIVOS ATUALIZADOS COM SUCESSO!');
            console.log('\n🚀 PRÓXIMOS PASSOS:');
            console.log('1. Testar conexão: node teste-conectividade-nova-instancia.js');
            console.log('2. Testar sistema: node testar-sistema-completo.js');
            console.log('3. Atualizar Netlify com novas variáveis');
        } else {
            console.log(`\n⚠️  Alguns arquivos tiveram erro. Verifique os ${erros} arquivos com problema.`);
        }
    }
}

// Executar
if (require.main === module) {
    const atualizador = new AtualizarTodosArquivos();
    atualizador.executar().catch(console.error);
}

module.exports = AtualizarTodosArquivos;
