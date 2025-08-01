# 🚀 Deploy Guide - Sala Livre

## 📋 Estrutura do Projeto

```
sala-livre/
├── netlify/              # Frontend para Netlify
│   ├── index.html       # Página de login
│   ├── css/             # Estilos
│   └── js/              # Scripts frontend
├── backend/             # API Node.js para Google Cloud
├── setup/               # Scripts de banco
└── README-DEPLOY.md     # Este arquivo
```

## 🌐 Deploy Frontend no Netlify

### 1. Preparar o Frontend
```bash
# Os arquivos estão prontos na pasta 'netlify/'
cd netlify/
```

### 2. Deploy no Netlify
1. **Login** no [Netlify](https://netlify.com)
2. **New site from Git** → Conecte seu GitHub
3. **Deploy settings**:
   - Branch: `main`
   - Publish directory: `netlify`
   - Build command: (deixe vazio)

### 3. Configurar Domínio
- **Site settings** → **Domain management**
- Configure seu domínio personalizado
- SSL será configurado automaticamente

## ☁️ Deploy Backend no Google Cloud

### 1. Configurar Google Cloud SQL
```bash
# Criar instância MySQL
gcloud sql instances create sala-livre-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1

# Criar database
gcloud sql databases create sala_livre \
    --instance=sala-livre-db

# Criar usuário
gcloud sql users create app_user \
    --instance=sala-livre-db \
    --password=SUA_SENHA_SEGURA
```

### 2. Configurar Variáveis de Ambiente
```bash
# No Google Cloud Console → App Engine → Settings → Environment Variables
DB_HOST=SEU_IP_CLOUD_SQL
DB_USER=app_user
DB_PASSWORD=SUA_SENHA_SEGURA
DB_NAME=sala_livre
GOOGLE_CLIENT_ID=SEU_CLIENT_ID
GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET
JWT_SECRET=SEU_JWT_SECRET_SUPER_SEGURO
```

### 3. Deploy API no Google App Engine
```bash
# Criar app.yaml
echo "runtime: nodejs18" > app.yaml

# Deploy
gcloud app deploy
```

## 🔗 Conectar Frontend e Backend

### 1. Atualizar API URL no Frontend
No arquivo `netlify/js/login-netlify.js`:
```javascript
const API_BASE_URL = 'https://sua-api.appspot.com';
```

### 2. Configurar CORS no Backend
No arquivo `.env` do backend:
```env
CORS_ORIGIN=https://seu-site.netlify.app
```

## 🔧 Configuração do Google OAuth

### 1. Google Cloud Console
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth 2.0 Client ID**

### 2. Configurar URLs Autorizadas
```
Authorized JavaScript origins:
- https://seu-site.netlify.app
- https://sua-api.appspot.com

Authorized redirect URIs:
- https://sua-api.appspot.com/api/auth/google/callback
```

### 3. Atualizar Frontend
No arquivo `netlify/js/login-netlify.js`:
```javascript
google.accounts.id.initialize({
    client_id: 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    // ...
});
```

## 📊 Configurar Banco de Dados

### 1. Executar Scripts de Setup
```bash
# No servidor onde a API está rodando
npm run setup-db
```

### 2. Verificar Conexão
```bash
# Teste a conexão
curl https://sua-api.appspot.com/api/auth/test
```

## 🔐 Configurações de Segurança

### 1. Variáveis Sensíveis
```env
# NUNCA committar essas variáveis
JWT_SECRET=gere_um_secret_super_seguro_256_bits
SESSION_SECRET=outro_secret_diferente_256_bits
DB_PASSWORD=senha_super_forte_do_mysql
GOOGLE_CLIENT_SECRET=secret_do_google_oauth
```

### 2. SSL/HTTPS
- Netlify: SSL automático
- Google Cloud: HTTPS por padrão

## 📈 Monitoramento

### 1. Logs do Backend
```bash
# Ver logs do App Engine
gcloud app logs tail -s default
```

### 2. Métricas do Netlify
- Deploy status
- Analytics
- Function logs

## 🚀 Comandos de Deploy

### Frontend (Netlify)
```bash
# Commit e push para Git
git add netlify/
git commit -m "Deploy frontend Sala Livre"
git push origin main

# Netlify fará deploy automático
```

### Backend (Google Cloud)
```bash
# Deploy da API
gcloud app deploy

# Ver status
gcloud app browse
```

## 🔍 Troubleshooting

### Erro CORS
- Verificar `CORS_ORIGIN` no backend
- Confirmar URLs no Google OAuth

### Erro de Banco
- Verificar IP do Cloud SQL
- Confirmar credenciais de usuário
- Testar conexão de rede

### Erro Google OAuth
- Verificar Client ID no frontend
- Confirmar URLs autorizadas
- Verificar certificados SSL

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do Netlify
2. Verificar logs do App Engine
3. Testar APIs individualmente
4. Verificar configurações de domínio

---

🎉 **Seu sistema Sala Livre estará online!**

- **Frontend**: https://seu-site.netlify.app
- **Backend**: https://sua-api.appspot.com
- **Admin**: admin@salalivre.com / admin123
