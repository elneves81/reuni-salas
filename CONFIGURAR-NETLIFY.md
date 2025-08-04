# 🎯 CONFIGURAÇÃO NETLIFY → GOOGLE CLOUD SQL

## ✅ O QUE FOI FEITO:

1. **✅ Netlify Functions criadas** - conectam diretamente com Google Cloud SQL
2. **✅ Rotas configuradas** - `/api/*` → functions
3. **✅ CRUD completo** - Usuários, Reuniões, Salas
4. **✅ Health check** - `/api/health`

## 🚀 PRÓXIMOS PASSOS (VOCÊ PRECISA FAZER):

### 1️⃣ Configurar Variáveis de Ambiente no Netlify

1. Acesse: https://app.netlify.com/
2. Vá para seu site **salalivre**
3. **Site Settings** > **Environment Variables**
4. Adicione estas variáveis:

```
DB_HOST = 34.45.56.79
DB_USER = app_user
DB_PASS = [SUA_SENHA_DO_GOOGLE_CLOUD_SQL]
DB_NAME = sala_livre
JWT_SECRET = [GERAR_UMA_CHAVE_FORTE]
```

### 2️⃣ Fazer Deploy dos Arquivos

1. Commit e push dos novos arquivos:
```bash
git add .
git commit -m "Netlify Functions com Google Cloud SQL"
git push
```

2. Netlify vai fazer deploy automaticamente

### 3️⃣ Testar a Conexão

1. Acesse: https://salalivre.netlify.app/api/health
2. Deve retornar:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "type": "Google Cloud SQL"
  }
}
```

### 4️⃣ Testar Sistema Completo

1. Abra: https://salalivre.netlify.app/
2. Console do navegador
3. Execute: `testarConectividadeNetlify()`

## 🎊 RESULTADO ESPERADO:

- ✅ Frontend no Netlify
- ✅ Functions conectando ao Google Cloud SQL  
- ✅ Usuários salvos no banco
- ✅ Reuniões sincronizadas entre máquinas
- ✅ Sistema completo funcionando

## 🆘 SE DER ERRO:

1. **Health check falha** → Verificar variáveis de ambiente
2. **Erro de conexão** → Verificar senha do banco
3. **Functions não funcionam** → Verificar deploy

**Precisa de ajuda com algum passo? 🤝**
