# 🐷 Hub Meinha Games

> **O caos organizado: finanças, zoeira e humilhação pública, tudo num só lugar.**

O Hub Meinha Games é o centro oficial do grupo Meinha Games, um portal completo que reúne o sistema financeiro existente com novos módulos sociais, mantendo o humor ácido e a linguagem debochada característica do grupo.

## 🎯 Funcionalidades

### 🏠 Home (Painel Central)
- **Ranking do Caloteiro Supremo:** Top 3 devedores com "Coroa do Vagabundo"
- **Estatísticas da Semana:** Dívidas criadas, pagamentos, eventos e novos caloteiros
- **Feed de Ações Recentes:** Frases automáticas em tom de humor
- **Botões de Ação Rápida:** Criar dívida, registrar rolê, adicionar mídia

### 🎉 Eventos (Rolês)
- Registro de encontros do grupo com fotos e vídeos
- Sistema de comentários e reações personalizadas (palavrões permitidos)
- **Modo Flashback:** Mostra eventos antigos aleatoriamente
- Upload de mídia integrado

### 💰 Financeiro (Módulo Existente Aprimorado)
- **Sirene do Calote:** Alerta piscando para dívidas vencidas
- **Relatório Auditoria Meinha (CPI):** PDF com ranking e estatísticas
- Mantém toda funcionalidade original intacta
- Visual aprimorado com identidade do Hub

### 📸 Mídia / Galeria
- Centralização de fotos e vídeos dos eventos
- **Modo Slideshow Aleatório:** Exibição em tela cheia sem legenda
- Filtros por evento e tipo de mídia
- Upload drag-and-drop

### 💬 Fórum Interno
- Debates, votações e zoeira sem limites
- Sistema de enquetes com contagem pública
- Categorias: Debate, Votação, Zoeira, Geral
- Comentários e reações

### 🔔 Sistema de Notificações & Níveis
- Notificações automáticas para ações importantes
- **Sistema de Níveis:** Meinho Júnior → Top 3 Meinhos
- **Flag de Caloteiro:** Ícone especial para devedores
- Interface de notificações em tempo real

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS com classes customizadas
- **Backend:** Next.js API Routes
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth + JWT
- **Charts:** Recharts
- **Icons:** Emojis nativos (estilo Meinha)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Firebase configurada

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd meinha
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... outras variáveis do Firebase
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
├── components/            # Componentes React
│   ├── HubLayout.tsx     # Layout principal com navegação
│   ├── HomePage.tsx      # Página inicial
│   ├── EventsPage.tsx    # Módulo de eventos
│   ├── MediaPage.tsx     # Galeria de mídia
│   ├── ForumPage.tsx     # Fórum interno
│   ├── Dashboard.tsx     # Módulo financeiro (existente)
│   └── NotificationSystem.tsx # Sistema de notificações
├── contexts/             # Contextos React
├── lib/                  # Utilitários e configurações
├── types/                # Definições TypeScript
└── styles/               # Estilos globais
```

## 🎨 Identidade Visual

- **Cores:** Gradientes vermelho-laranja, bordas pretas, sombras coloridas
- **Tipografia:** Inter + JetBrains Mono
- **Estilo:** Humor ácido, linguagem debochada, visual colorido e engraçado
- **Componentes:** Cards com bordas grossas, botões com sombras, animações personalizadas

## 🔧 Funcionalidades Técnicas

### Navegação por Abas
- Sistema de roteamento interno sem reload
- Estado persistente entre abas
- Indicadores visuais de aba ativa

### Sistema de Notificações
- Notificações em tempo real
- Diferentes tipos: dívidas, eventos, fórum
- Sistema de leitura/não lida
- Contador de notificações não lidas

### Upload de Mídia
- Suporte a fotos e vídeos
- Preview antes do upload
- Associação com eventos
- Compressão automática

### Sistema de Níveis
- XP baseado em ações do usuário
- 5 níveis diferentes
- Flag especial para caloteiros
- Barra de progresso visual

## 🚨 Recursos Especiais

### Sirene do Calote
- Alerta piscante para dívidas vencidas
- Animação de pulso
- Mensagem personalizada com nome do devedor

### Ranking de Caloteiros
- Top 3 devedores com coroa especial
- Tooltips com informações adicionais
- Atualização em tempo real

### Relatório CPI
- Geração de PDF com estatísticas
- Ranking completo de devedores
- Conclusão humorística

## 🤝 Contribuição

Este projeto é privado do grupo Meinha Games. Para sugestões ou melhorias, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Projeto privado - Todos os direitos reservados ao grupo Meinha Games.

Adicionado 

---

**"A vergonha continua."** 🐷