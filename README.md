# 📅 Reunião Fácil

Sistema completo de agendamento de salas de reuniões com hierarquia de usuários, dashboard administrativo e calendário interativo.

## 🚀 Funcionalidades

### � Autenticação
- ✅ **Login com usuário e senha** - Sistema de login tradicional
- ✅ **Login com Google OAuth** - Autenticação social integrada
- ✅ **Cadastro de novos usuários** - Interface intuitiva para criação de contas
- ✅ **Recuperação de senha** - Sistema de reset via email
- ✅ **Verificação de força da senha** - Feedback visual em tempo real
- ✅ **Lembrança de login** - Opção "lembrar de mim"

### 👥 Gerenciamento de Usuários
- 🏢 **Hierarquia de usuários** (Admin > Manager > User)
- 🏬 **Departamentos e permissões** - Organização por setores
- 👨‍💼 **Perfis de usuário** - Dados pessoais e configurações
- 📊 **Dashboard administrativo** - Controle total do sistema

### 🏢 Gerenciamento de Salas
- 📋 **Cadastro e edição de salas** - Interface completa
- 🎨 **Cores personalizadas** - Identificação visual das salas
- 📐 **Capacidade e equipamentos** - Detalhes técnicos
- 📍 **Localização** - Informações de acesso
- 🖼️ **Imagens das salas** - Galeria visual

### 📅 Sistema de Reservas
- 📅 **Calendário visual** (estilo Google Calendar)
- ⏰ **Reservas por horário** - Interface drag-and-drop
- 🔄 **Reservas recorrentes** - Eventos que se repetem
- 👥 **Lista de participantes** - Convites automáticos
- 📧 **Notificações automáticas** - Lembretes por email
- 🚫 **Prevenção de conflitos** - Validação automática

### 📊 Dashboard e Relatórios
- 📈 **Estatísticas de uso** - Métricas em tempo real
- 📊 **Relatórios de ocupação** - Análises detalhadas
- 🔍 **Filtros avançados** - Busca personalizada
- 📤 **Exportação de dados** - Relatórios em PDF/Excel

## 🛠️ Tecnologias

### Frontend
- **HTML5** - Estrutura semântica moderna
- **CSS3** - Design responsivo com cores verde/vermelho
- **JavaScript ES6+** - Interatividade avançada
- **Font Awesome** - Ícones profissionais
- **Google Fonts (Inter)** - Tipografia elegante

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web robusto
- **MySQL** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Passport.js** - Múltiplas estratégias de login
- **bcryptjs** - Criptografia de senhas

## 📋 Pré-requisitos

- **Node.js** v16 ou superior
- **MySQL** 5.7+ ou 8.0+
- **npm** ou **yarn**
- Conta Google (para OAuth)

## ⚡ Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/reuniao-facil.git
cd reuniao-facil
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
# Edite o arquivo .env com suas configurações
# DB_HOST, DB_USER, DB_PASSWORD, GOOGLE_CLIENT_ID, etc.
```

### 4. Configure o banco de dados
```bash
# Execute o setup automático que cria todas as tabelas
npm run setup-db
```

### 5. Inicie o servidor
```bash
# Desenvolvimento com hot-reload
npm run dev

# Produção
npm start
```

### 6. Acesse a aplicação
```
http://localhost:3000
```

## 🔧 Configuração Detalhada

### Banco de Dados MySQL
Configure no arquivo `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=reuniao_facil
DB_USER=root
DB_PASSWORD=sua_senha
```

### Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie credenciais OAuth 2.0
3. Configure URLs autorizadas
4. Adicione no `.env`:
```env
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
```

## 🎨 Design e Interface

### Identidade Visual "Reunião Fácil"
- **Verde Principal**: `#22c55e` - Botões primários, sucesso
- **Verde Escuro**: `#16a34a` - Estados hover e ativos  
- **Vermelho**: `#ef4444` - Erros, cancelamentos, alertas
- **Tipografia**: Inter (Google Fonts) - Moderna e legível
- **Design**: Mobile-first, responsivo, acessível

### Recursos de UX
- Animações suaves de transição
- Feedback visual imediato
- Estados de loading personalizados
- Modais elegantes
- Formulários inteligentes com validação

## 👤 Primeiro Acesso

Após a configuração do banco de dados:

**Usuário Administrador:**
- **Email**: `admin@reuniaofacil.com`
- **Senha**: `admin123`

**⚠️ IMPORTANTE:** Altere a senha após o primeiro login!

## 📱 Recursos Mobile

- Design responsivo otimizado
- Interface touch-friendly
- Navegação por gestos
- Performance otimizada
- PWA ready (Progressive Web App)

## 🗄️ Estrutura do Banco

O sistema cria automaticamente:
- **8 tabelas principais** com relacionamentos
- **Dados iniciais** (admin, salas, departamentos)
- **Índices otimizados** para performance
- **Triggers e constraints** para integridade

## 📝 Scripts Disponíveis

```bash
npm start           # Iniciar servidor produção
npm run dev         # Desenvolvimento com nodemon
npm run setup-db    # Configurar banco de dados
npm run reset-db    # Resetar banco (CUIDADO!)
npm test           # Executar testes (futuro)
```

## � Deploy em Produção

### Google Cloud Platform
Totalmente compatível com:
- **Cloud SQL** (MySQL)
- **App Engine** 
- **Compute Engine**
- **Cloud Run**

### Configuração de Produção
```env
NODE_ENV=production
APP_URL=https://seudominio.com
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Equipe

**Reunião Fácil Team**
- Sistema desenvolvido com foco em usabilidade
- Interface moderna e intuitiva
- Código limpo e bem documentado

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela no GitHub!**

🎯 **Próximas versões**: Dashboard completo, calendário avançado, relatórios, notificações push

## 🎨 Tecnologias
- Frontend: HTML5, CSS3, JavaScript ES6+
- Backend: Node.js, Express
- Banco: MySQL
- UI: CSS Grid, Flexbox, Animações CSS3

## 📱 Responsivo
Totalmente responsivo para desktop, tablet e mobile.
