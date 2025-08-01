# 🚀 Configuração Google Cloud SQL - Sala Livre

## 📋 **Pré-requisitos**
- Conta no Google Cloud Platform
- Projeto criado no Google Cloud Console
- Faturamento habilitado no projeto

## 🔧 **1. Configurar Google Cloud CLI**

### **Inicializar e fazer login:**
```bash
# Fazer login no Google Cloud
gcloud auth login

# Configurar projeto (substitua YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Habilitar APIs necessárias
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## 🗄️ **2. Criar Instância MySQL**

### **Comando para criar a instância:**
```bash
gcloud sql instances create sala-livre-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=04 \
    --authorized-networks=0.0.0.0/0
```

### **Criar banco de dados:**
```bash
gcloud sql databases create sala_livre --instance=sala-livre-db
```

### **Criar usuário:**
```bash
gcloud sql users create app_user \
    --instance=sala-livre-db \
    --password=SUA_SENHA_SUPER_SEGURA_AQUI
```

### **Obter IP da instância:**
```bash
gcloud sql instances describe sala-livre-db --format="value(ipAddresses[0].ipAddress)"
```

## 🔐 **3. Configurar Variáveis de Ambiente**

### **Criar arquivo .env com suas credenciais:**
```env
# Database do Google Cloud SQL
DB_HOST=SEU_IP_AQUI
DB_USER=app_user
DB_PASSWORD=SUA_SENHA_SUPER_SEGURA_AQUI
DB_NAME=sala_livre
DB_PORT=3306

# Configurações de sessão
SESSION_SECRET=gere_um_secret_super_seguro_256_bits
JWT_SECRET=outro_secret_diferente_para_jwt_256_bits

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret

# Configurações de ambiente
NODE_ENV=production
PORT=3000
```

## 🏗️ **4. Executar Setup do Banco**

### **Instalar dependências e configurar tabelas:**
```bash
# Instalar dependências
npm install

# Executar script de setup do banco
npm run setup-db
```

## 🌐 **5. Via Interface Web (Alternativa)**

Se preferir usar a interface web:

1. **Acesse:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Menu:** SQL → Criar instância → MySQL
3. **Configurações:**
   - **ID da instância:** `sala-livre-db`
   - **Senha root:** Crie uma senha forte
   - **Versão:** MySQL 8.0
   - **Região:** us-central1
   - **Tipo de máquina:** db-f1-micro (mais barato)

4. **Rede:**
   - **Redes autorizadas:** `0.0.0.0/0` (para desenvolvimento)
   - **SSL:** Opcional para desenvolvimento

5. **Criar banco:**
   - Vá em **Bancos de dados** → **Criar banco de dados**
   - **Nome:** `sala_livre`

6. **Criar usuário:**
   - Vá em **Usuários** → **Adicionar conta de usuário**
   - **Nome:** `app_user`
   - **Senha:** Crie uma senha forte

## 📝 **6. Testar Conexão**

### **Script de teste:**
```javascript
// test-connection.js
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'SEU_IP_AQUI',
            user: 'app_user',
            password: 'SUA_SENHA',
            database: 'sala_livre',
            port: 3306
        });
        
        console.log('✅ Conexão com MySQL bem-sucedida!');
        
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query de teste executada:', rows);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    }
}

testConnection();
```

### **Executar teste:**
```bash
node test-connection.js
```

## 🚨 **Dicas de Segurança**

### **1. Senhas Seguras:**
- Use senhas com pelo menos 16 caracteres
- Misture letras, números e símbolos
- Nunca commite senhas no Git

### **2. Rede:**
- Para produção, restrinja IPs autorizados
- Use conexões SSL sempre que possível
- Configure firewall adequadamente

### **3. Backup:**
- Habilite backups automáticos
- Configure retenção adequada
- Teste restauração periodicamente

## 💰 **Custos Estimados**

### **db-f1-micro (mais barato):**
- **CPU:** 1 vCPU compartilhada
- **RAM:** 0.6 GB
- **Custo:** ~$7-15/mês
- **Ideal para:** Desenvolvimento e testes

### **Para produção, considere:**
- **db-n1-standard-1:** ~$25-40/mês
- **Backups:** ~$0.08/GB/mês
- **Tráfego:** Gratuito até certo limite

## 🔄 **7. Próximos Passos**

Após configurar o banco:

1. ✅ **Atualizar .env** com credenciais reais
2. ✅ **Executar npm run setup-db**
3. ✅ **Testar login com admin@salalivre.com**
4. ✅ **Configurar Google OAuth**
5. ✅ **Deploy no App Engine ou Cloud Run**

---

## 📞 **Comandos Úteis**

```bash
# Ver instâncias
gcloud sql instances list

# Ver bancos
gcloud sql databases list --instance=sala-livre-db

# Ver usuários
gcloud sql users list --instance=sala-livre-db

# Parar instância (economizar)
gcloud sql instances patch sala-livre-db --activation-policy=NEVER

# Iniciar instância
gcloud sql instances patch sala-livre-db --activation-policy=ALWAYS

# Deletar instância (cuidado!)
gcloud sql instances delete sala-livre-db
```

**🎯 Após configurar, você terá o banco MySQL funcionando na nuvem!**
