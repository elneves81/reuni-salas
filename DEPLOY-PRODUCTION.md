# 🚀 DEPLOY PARA PRODUÇÃO: Conectar Netlify → Google Cloud SQL

## 📋 SITUAÇÃO ATUAL

- ✅ **Frontend**: https://salalivre.netlify.app/ (funcionando)
- ✅ **Backend local**: `server.js` com Google Cloud SQL (funcionando)
- ❌ **Conexão**: Frontend não consegue acessar o banco ainda

## 🎯 OBJETIVO

Conectar o frontend no Netlify com o banco Google Cloud SQL através de um servidor backend em produção.

## 📦 OPÇÕES DE DEPLOY DO BACKEND

### 🔥 OPÇÃO 1: Google Cloud Run (RECOMENDADO)
```bash
# 1. Instalar Google Cloud CLI
# 2. Fazer login
gcloud auth login

# 3. Configurar projeto
gcloud config set project SEU-PROJETO-ID

# 4. Criar Dockerfile
# 5. Deploy
gcloud run deploy salalivre-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=SEU_CLOUD_SQL_IP,DB_USER=app_user,DB_PASS=SUA_SENHA,DB_NAME=sala_livre
```

### 🌊 OPÇÃO 2: Heroku
```bash
# 1. Criar app
heroku create seu-salalivre-backend

# 2. Configurar variáveis
heroku config:set DB_HOST=34.45.56.79
heroku config:set DB_USER=app_user  
heroku config:set DB_PASS=SUA_SENHA
heroku config:set DB_NAME=sala_livre

# 3. Deploy
git push heroku main
```

### ⚡ OPÇÃO 3: Railway
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login e deploy
railway login
railway init
railway up
```

## 🔧 PREPARAÇÃO PARA DEPLOY

### 1. Criar Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2. Criar .dockerignore
```
node_modules
npm-debug.log
.git
.env
netlify
README.md
```

### 3. Atualizar package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 4. Configurar variáveis de ambiente
Criar arquivo `.env.production`:
```env
PORT=3000
NODE_ENV=production

# Google Cloud SQL
DB_HOST=34.45.56.79
DB_USER=app_user
DB_PASS=SUA_SENHA_AQUI
DB_NAME=sala_livre

# JWT Secret
JWT_SECRET=sua_chave_secreta_super_forte_aqui

# CORS
ALLOWED_ORIGINS=https://salalivre.netlify.app,https://localhost:3000
```

## 🔗 CONECTAR FRONTEND COM BACKEND

### 1. Atualizar configuração
Editar `netlify/js/config.js`:
```javascript
production: {
    apiBaseURL: 'https://SEU-BACKEND-DEPLOY.herokuapp.com/api',
    // ou
    apiBaseURL: 'https://salalivre-backend-xxx.run.app/api',
    database: 'google-cloud-sql'
}
```

### 2. Atualizar headers do servidor
Adicionar no `server.js`:
```javascript
app.use(cors({
    origin: ['https://salalivre.netlify.app', 'http://localhost:3000'],
    credentials: true
}));
```

## ✅ CHECKLIST DE DEPLOY

- [ ] 1. Backend funcionando localmente
- [ ] 2. Google Cloud SQL acessível  
- [ ] 3. Dockerfile criado
- [ ] 4. Variáveis de ambiente configuradas
- [ ] 5. Deploy do backend realizado
- [ ] 6. URL do backend obtida
- [ ] 7. config.js atualizado com URL real
- [ ] 8. Frontend redesployado no Netlify
- [ ] 9. Teste de conectividade executado
- [ ] 10. Sistema funcionando end-to-end

## 🧪 TESTAR APÓS DEPLOY

1. Acessar https://salalivre.netlify.app/
2. Abrir console do navegador
3. Executar: `testarConectividadeNetlify()`
4. Verificar se todas as conexões estão OK

## 🆘 SOLUÇÕES RÁPIDAS

### Se der erro de CORS:
```javascript
// No server.js
app.use(cors({
    origin: true, // Temporário para debug
    credentials: true
}));
```

### Se der erro de conexão:
1. Verificar se backend está online: `curl https://SEU-BACKEND.com/api/health`
2. Verificar variáveis de ambiente
3. Verificar logs do serviço cloud

### Se der erro de SQL:
1. Verificar IP do Google Cloud SQL autorizado
2. Verificar credenciais do banco
3. Verificar se banco `sala_livre` existe

## 📞 SUPORTE

Após seguir este guia, o sistema estará 100% funcional com:
- ✅ Frontend no Netlify
- ✅ Backend em produção  
- ✅ Banco Google Cloud SQL
- ✅ Sincronização entre máquinas
- ✅ Controle admin funcionando
