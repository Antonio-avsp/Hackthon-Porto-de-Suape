# 🛡️ GML — Plataforma de Gestão Ambiental (React)

Versão **React (Vite + React 18)** da Plataforma de Gestão Ambiental GML — Porto de Suape.
Refatoração do protótipo single-page para uma arquitetura de componentes.

## ▶️ Como executar

```bash
cd gml-react
npm install
npm run dev        # ambiente de desenvolvimento (http://localhost:5173)
# ou
npm run build && npm run preview   # build de produção
```

## 🧭 Áreas

| Aba | O que faz |
|-----|-----------|
| **Dashboard** | Cronograma Gantt, alertas automáticos, licenças por categoria (AUT, LP, LI, LO, RLO, PLI, CP, LS) e agenda (calendário) |
| **Licenças** | Tabela com responsável e status; clique abre o **modal de detalhe** da licença; CRUD completo |
| **Prazos e Demandas** | Demandas e prazos unificados (responsável, prioridade, status) |
| **Evidências** | Upload e captura no app com **geolocalização automática** e mini-mapa |
| **Assistente IA** | Chat e leitura de **PDF/imagem** de licença via **backend GML** (Gemini), que preenche o cadastro e exporta para Excel |

## 🤖 Leitura por IA (via backend)

O chat e a leitura de licenças usam o **[backend GML](../backend/)**, que conversa com o
**Gemini** com a chave protegida no servidor — **a chave nunca fica no navegador**.

1. Suba o backend (`cd backend && npm install && npm run dev` — porta `3333`).
2. No frontend, a URL do backend vem de `VITE_API_URL` (veja `.env.example`, padrão
   `http://localhost:3333`) e pode ser ajustada em runtime no modal **⚙ Configurar IA**
   (com botão **Testar conexão**).
3. Sem backend acessível, o Assistente opera em **modo demonstração** (extração simulada).

Fluxo: `Frontend → API Backend → Gemini → Backend → Frontend`. Detalhes e endpoints em
[`backend/README.md`](../backend/README.md).

## 🗂️ Estrutura

```
gml-react/
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx            # bootstrap React + Provider
    ├── App.jsx             # shell (sidebar + topbar + router de telas + modais)
    ├── store.jsx           # contexto de estado (licenças, demandas, evidências, modais…)
    ├── data.js             # base de dados de demonstração + helpers puros
    ├── icons.jsx           # ícones SVG + componente <Icon>
    ├── ui.jsx              # componentes visuais reutilizáveis (tags, chips, badges)
    ├── styles.css          # design system (paleta GML)
    ├── components/         # Sidebar, Topbar, Toasts, Modal
    ├── screens/            # Dashboard, Licencas, Prazos, Evidencias, AssistenteIA
    ├── modals/             # LicencaForm, LicencaDetail, Historico, DemandaForm, AIKeyConfig
    └── lib/                # api.js (cliente do backend de IA), ai.js (demo + Excel), geo.js
```

## 🛠️ Tecnologia

React 18 + Vite. Sem dependências de UI externas — design system próprio em CSS.
Dados fictícios, para demonstração do conceito.
