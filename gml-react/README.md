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
| **Assistente IA** | Chat que lê **PDF/imagem** de licença por **OCR/visão** (API do Claude), preenche o cadastro e exporta para Excel |

## 🤖 Leitura por IA (OCR/Visão)

Em **⚙ Configurar IA**, informe sua chave da API Anthropic (`sk-ant-…`, salva apenas no
navegador). Ao anexar um PDF/imagem, o app chama a **API do Claude** (`claude-opus-4-8`) com
visão/PDF e extração estruturada (JSON). Sem chave, há um **modo demonstração** com extração
simulada.

> ⚠️ A chamada é feita direto do navegador (`anthropic-dangerous-direct-browser-access`),
> o que expõe a chave. **Em produção, faça a chamada por um backend.**

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
    └── lib/                # ai.js (visão/OCR + Excel), geo.js (geolocalização)
```

## 🛠️ Tecnologia

React 18 + Vite. Sem dependências de UI externas — design system próprio em CSS.
Dados fictícios, para demonstração do conceito.
