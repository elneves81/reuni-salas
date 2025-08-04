# 🛠️ CONFIGURAR NOVA INSTÂNCIA GOOGLE CLOUD SQL

## 📋 CHECKLIST COMPLETO DE CONFIGURAÇÃO

### 1. 🗄️ CONFIGURAÇÕES BÁSICAS DA INSTÂNCIA

**Nome da Instância:** `reunipro-instance` (ou o nome que você escolheu)
**Tipo:** MySQL 8.0
**Região:** us-central1 (ou sua região preferida)
**Zona:** us-central1-a

### 2. 🔐 CONFIGURAÇÕES DE AUTENTICAÇÃO

**Usuário Root:**
- Usuário: `root`
- Senha: `Neves2025@`

**Criar Usuário Adicional (Recomendado):**
- Usuário: `reunipro_user`
- Senha: `Neves2025@`
- Host: `%` (qualquer IP)

### 3. 🌐 CONFIGURAÇÕES DE REDE

**IPs Autorizados (Adicionar na seção "Authorized Networks"):**
```
0.0.0.0/0  (Para desenvolvimento - REMOVER em produção)
177.87.200.82  (Seu IP atual)
```

**Configurações de Conectividade:**
- ✅ Habilitar IP Público
- ✅ Permitir conexões SSL/TLS
- ❌ Exigir SSL (para desenvolvimento)

### 4. 📊 CRIAR BANCO DE DADOS

**Nome do Banco:** `reuni-dep`
**Charset:** `utf8mb4`
**Collation:** `utf8mb4_unicode_ci`

### 5. 📋 CRIAR TABELAS

Execute os seguintes comandos SQL na nova instância:

```sql
-- 1. Tabela de usuários
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabela de salas
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 10,
    equipment TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabela de reservas
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
    organizer VARCHAR(255),
    organizer_name VARCHAR(255),
    participants TEXT,
    equipment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Índices para performance
CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### 6. 📦 DADOS INICIAIS

```sql
-- Inserir salas padrão
INSERT INTO rooms (name, capacity, equipment, description) VALUES
('Sala Alpha', 8, 'Projetor, TV 55", Quadro branco', 'Sala ideal para reuniões executivas'),
('Sala Beta', 12, 'Projetor, Sistema de áudio, Videoconferência', 'Sala para apresentações e treinamentos'),
('Sala Gamma', 6, 'TV 42", Quadro branco', 'Sala para reuniões pequenas'),
('Sala Delta', 15, 'Projetor, Sistema de som, Microfone', 'Auditório para eventos maiores'),
('Sala Omega', 4, 'TV 32", Mesa redonda', 'Sala para reuniões íntimas');

-- Inserir usuário administrador padrão
INSERT INTO users (name, email, password, role) VALUES
('Administrador', 'admin@reunipro.com', '$2b$10$YourHashedPasswordHere', 'admin');
```

### 7. 🔧 CONFIGURAÇÕES DE APLICAÇÃO

Após criar a instância, você precisa atualizar os seguintes arquivos com as novas configurações:

#### A. `netlify/functions/db-utils.js`
```javascript
const dbConfig = {
    host: '35.184.206.243',  // Nova instância
    user: 'root',
    password: 'Neves2025@',
    database: 'reuni-dep',
    port: 3306,
    ssl: {
        rejectUnauthorized: false
    },
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};
```

#### B. `setup/database.js`
```javascript
const config = {
    host: '35.184.206.243',
    user: 'root',
    password: 'Neves2025@',
    database: 'reuni-dep',
    port: 3306
};
```

#### C. Arquivos de teste (todos os arquivos .js na raiz)
Atualize todos os arquivos que contenham configurações de banco com o novo IP.

### 8. 🌍 VARIÁVEIS DE AMBIENTE NO NETLIFY

No painel do Netlify, adicione as seguintes variáveis:

```
DB_HOST=35.184.206.243
DB_USER=root
DB_PASSWORD=Neves2025@
DB_NAME=reuni-dep
DB_PORT=3306
```

### 9. 🧪 COMANDOS DE TESTE

Após configurar tudo, execute estes testes:

```bash
# 1. Testar conexão básica
node diagnosticar-banco.js

# 2. Testar estrutura das tabelas
node verificar-estrutura-bookings.js

# 3. Testar sistema completo
node testar-sistema-completo.js

# 4. Testar credenciais
node testar-credenciais-banco.js
```

### 10. 🔒 SEGURANÇA EM PRODUÇÃO

**IMPORTANTE:** Quando colocar em produção:

1. **Remover IP 0.0.0.0/0** dos IPs autorizados
2. **Adicionar apenas IPs específicos** do Netlify
3. **Habilitar SSL obrigatório**
4. **Criar usuário específico** para a aplicação (não usar root)
5. **Configurar backup automático**

### 11. 📞 IPs DO NETLIFY PARA AUTORIZAR

Se você quiser restringir apenas ao Netlify, adicione estes IPs:

```
18.208.177.192/26
18.208.177.0/26
3.211.255.192/26
3.216.99.192/26
3.228.39.0/26
```

## 🚀 PRÓXIMOS PASSOS

1. **Anote o IP público** da nova instância
2. **Execute os comandos SQL** para criar as tabelas
3. **Atualize os arquivos** de configuração com o novo IP
4. **Teste a conectividade** com os scripts
5. **Deploy no Netlify** com as novas configurações

## ❓ EM CASO DE PROBLEMAS

1. Verifique se o IP está autorizado
2. Confirme se a senha está correta
3. Teste conexão com MySQL Workbench
4. Verifique logs do Google Cloud
5. Confirme se a instância está rodando

---

**📝 ANOTE AQUI AS INFORMAÇÕES DA SUA INSTÂNCIA:**

- **Nome da Instância:** ________________________________
- **IP Público:** ____________________________________
- **Região:** _______________________________________
- **Status:** ✅ Configurada | ❌ Pendente
