# 🛡️ GML — Plataforma Inteligente de Gestão Ambiental

> **Desafio GML** — Transformando dificuldades da Gestão Ambiental em soluções digitais · Porto de Suape
>
> *Cumprir é importante. **Comprovar é indispensável.***

Plataforma que centraliza licenças, condicionantes, prazos e evidências ambientais —
transformando dados dispersos em **inteligência, prevenção, conformidade e governança**.

A aplicação é um app **React (Vite + React 18)** em [`gml-react/`](gml-react/), organizado em
componentes, com leitura de licenças por **IA (OCR/visão)**.

---

## ▶️ Como executar

```bash
cd gml-react
npm install
npm run dev        # http://localhost:5173
# ou: npm run build && npm run preview
```

---

## 🧭 Áreas

| Aba | O que faz |
|-----|-----------|
| **Dashboard** | Cronograma Gantt de condicionantes, alertas automáticos, licenças por categoria (AUT, LP, LI, LO, RLO, PLI, CP, LS) e agenda (calendário) |
| **Licenças** | Tabela com responsável e status; clique abre o **modal de detalhe**; cadastro, edição, exclusão e histórico |
| **Prazos e Demandas** | Demandas e prazos unificados, com responsável, prioridade, status e alertas |
| **Evidências** | Upload (imagem/doc/vídeo) e captura no app, com **geolocalização automática** (lat, long, data, hora, usuário) e mini-mapa |
| **Assistente IA** | Chat com anexos: envie o PDF/imagem de uma licença e a IA extrai tipo, órgão, processo, validade e condicionantes, **preenche o cadastro** e **exporta para Excel** |

### 🤖 Leitura por IA (OCR/Visão)

O assistente funciona **sem nenhuma configuração na interface**. Por padrão, opera em
**modo demonstração** (extração simulada). Para ativar a **leitura real** de PDFs/imagens
via **API do Claude** (`claude-opus-4-8`, visão/PDF + extração estruturada em JSON),
configure a chave **uma única vez**:

```bash
cd gml-react
cp .env.example .env        # cole sua chave em VITE_ANTHROPIC_API_KEY
```

Pronto — a IA passa a ler documentos reais automaticamente, preencher o cadastro e exportar
para Excel, sem precisar configurar nada na tela.

> ⚠️ A chamada é feita direto do navegador (com `anthropic-dangerous-direct-browser-access`),
> o que expõe a chave no bundle. **Em produção, faça a chamada por um backend.**

---

## 🎨 Identidade visual (paleta oficial)

| Cor | HEX | Uso |
|-----|-----|-----|
| 🔵 Azul Governança | `#2E60AD` | Cabeçalhos, menus, botões, KPIs |
| 🟡 Amarelo Estratégico | `#FCB316` | Alertas, atenção, chamadas para ação |
| 🟢 Verde Conformidade | `#28A745` | Itens válidos / concluídos |
| 🔴 Vermelho Crítico | `#DC3545` | Vencimentos, não conformidades |
| ⚪ Branco | `#FFFFFF` | Fundo principal |
| ⚫ Cinza Corporativo | `#6C757D` | Informações secundárias |

Princípios de interface: fundo predominantemente branco, **barra lateral azul institucional**,
cards com bordas suaves, ícones minimalistas e indicadores de risco em **sistema semafórico**
(verde · amarelo · vermelho).

---

## 🗂️ Estrutura

```
gml-react/
├── index.html · vite.config.js · package.json
└── src/
    ├── main.jsx · App.jsx          # bootstrap + shell + router de telas + modais
    ├── store.jsx                   # contexto de estado (licenças, demandas, evidências…)
    ├── data.js · icons.jsx · ui.jsx · styles.css
    ├── components/  Sidebar · Topbar · Toasts · Modal
    ├── screens/     Dashboard · Licencas · Prazos · Evidencias · AssistenteIA
    ├── modals/      LicencaForm · LicencaDetail · Historico · DemandaForm · AIKeyConfig
    └── lib/         ai.js (visão/OCR + Excel) · geo.js (geolocalização)
```

Detalhes: [`gml-react/README.md`](gml-react/README.md).

## 🛠️ Tecnologia

React 18 + Vite. Sem dependências de UI externas — design system próprio em CSS.

> ⚠️ Dados exibidos são **fictícios**, para fins de demonstração do conceito.
