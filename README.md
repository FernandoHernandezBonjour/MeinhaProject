# Sistema de Gerenciamento de Dívidas

Um sistema completo para controle de empréstimos e dívidas entre usuários, desenvolvido com Next.js, Tailwind CSS e Firebase Firestore.

## 🚀 Funcionalidades

### Autenticação e Usuários
- ✅ Login com nome de usuário e senha
- ✅ Cadastro de usuários (apenas administradores)
- ✅ Alteração obrigatória de senha no primeiro login
- ✅ Completar perfil (foto, email, nome, chave PIX)
- ✅ Diferentes roles: Admin e User

### Gerenciamento de Dívidas
- ✅ Cadastro de dívidas entre usuários
- ✅ Visualização de todas as dívidas em aberto
- ✅ Marcar dívidas como pagas
- ✅ Controle de permissões (apenas dono ou admin pode alterar)
- ✅ Status: OPEN e PAID

### Dashboard
- ✅ Lista de dívidas ordenadas por vencimento
- ✅ Cards com informações detalhadas
- ✅ Indicação visual de dívidas vencidas
- ✅ Gráficos de maiores credores e devedores
- ✅ Resumo estatístico

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Authentication**: Sistema customizado com bcryptjs

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Firebase
- Projeto Firebase configurado

## 🔧 Configuração

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd sistema-dividas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o Firestore Database
4. Obtenha as credenciais do projeto

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Firebase Configuration (PRIVATE - Server-side only)
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=seu_app_id

# Default password for new users
DEFAULT_PASSWORD=123456

# JWT Secret for custom authentication
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui

# Session Secret
SESSION_SECRET=seu_session_secret_muito_seguro_aqui
```

**⚠️ IMPORTANTE:** As credenciais do Firebase agora são privadas e só funcionam no servidor. Isso garante que suas credenciais não sejam expostas no frontend.

### 5. Configure o Firestore

No Firebase Console, configure as regras do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para todos (em produção, configure regras mais restritivas)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 6. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 👤 Primeiro Acesso

1. **Criar usuário admin**: Como não há usuários iniciais, você precisará criar um usuário admin manualmente no Firestore:
   - Acesse o Firebase Console
   - Vá para Firestore Database
   - Crie uma coleção chamada `users`
   - Adicione um documento com os seguintes campos:
     ```json
     {
       "username": "admin",
       "role": "admin",
       "passwordChanged": false,
       "createdAt": "timestamp",
       "updatedAt": "timestamp"
     }
     ```

2. **Login inicial**:
   - Username: `admin`
   - Senha: `123456` (ou o valor definido em DEFAULT_PASSWORD)

3. **Alterar senha**: O sistema obrigará a alterar a senha no primeiro login

4. **Cadastrar usuários**: Use o botão "Cadastrar Usuário" no dashboard

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── App.tsx           # Componente principal da aplicação
│   ├── Dashboard.tsx     # Dashboard principal
│   ├── DebtCard.tsx      # Card de dívida
│   ├── DebtFormServer.tsx # Formulário de cadastro de dívida (Server Actions)
│   ├── DashboardCharts.tsx # Gráficos do dashboard
│   ├── LoginFormServer.tsx # Formulário de login (Server Actions)
│   ├── PasswordChangeForm.tsx # Formulário de alteração de senha
│   ├── ProfileCompletionForm.tsx # Formulário de completar perfil
│   └── UserRegistration.tsx # Formulário de cadastro de usuário
├── contexts/             # Contextos React
│   └── AuthContext.tsx   # Contexto de autenticação
├── lib/                  # Utilitários e configurações
│   ├── actions/          # Server Actions
│   │   ├── auth.ts      # Ações de autenticação
│   │   ├── users.ts     # Ações de usuários
│   │   └── debts.ts     # Ações de dívidas
│   ├── auth-server.ts    # Autenticação server-side
│   ├── firebase-server.ts # Configuração Firebase Admin
│   └── firestore-server.ts # Serviços Firestore server-side
└── types/               # Definições TypeScript
    └── index.ts         # Tipos da aplicação
```

## 🔒 Segurança

### Arquitetura Segura
- **Credenciais Privadas**: Firebase configurado apenas no servidor
- **Server Actions**: Todas as operações de dados via Server Actions do Next.js 14
- **Cookies HttpOnly**: Tokens JWT armazenados em cookies seguros
- **Autenticação Server-Side**: Verificação de autenticação no servidor

### Controles de Acesso
- Senhas são hashadas com bcryptjs
- Controle de permissões baseado em roles (admin/user)
- Validação de dados no frontend e backend
- Middleware de autenticação para rotas protegidas

### Melhores Práticas
- Variáveis de ambiente privadas (não NEXT_PUBLIC)
- Tokens JWT com expiração
- Cookies com flags de segurança (httpOnly, secure, sameSite)
- Validação rigorosa de entrada de dados

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras plataformas
O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer fork do projeto
2. Criar uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abrir um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.
