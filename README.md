# 🛡️ Sentinela — Plataforma Inteligente de Governança Ambiental

> **Desafio GML** — Transformando dificuldades da Gestão Ambiental em soluções digitais · Porto de Suape
>
> *Cumprir é importante. **Comprovar é indispensável.***

Protótipo **visual** (front-end) de uma plataforma que centraliza licenças, condicionantes,
prazos e evidências ambientais — transformando dados dispersos em **inteligência, prevenção,
conformidade e governança**.

Este repositório contém **somente a parte visual** (telas navegáveis), sem back-end.

---

## ▶️ Como executar

Não há build nem dependências. Basta abrir o arquivo no navegador:

```bash
# Opção 1 — abrir direto
abra o arquivo  index.html  no navegador

# Opção 2 — servidor local (recomendado p/ navegação completa)
python3 -m http.server 8080
# depois acesse  http://localhost:8080
```

O fluxo começa na tela de **login** (`index.html`) → **Dashboard** → demais módulos pela barra lateral.

### 🧩 Versão single-page (`gml.html`)

`gml.html` é a versão **single-page** e **simplificada** da plataforma — HTML/CSS/JS puro,
**sem build e sem framework**. Foco em menos telas, menos cliques e mais automação/IA.

Possui apenas **5 áreas**:

| Aba | O que faz |
|-----|-----------|
| **Dashboard** | Cronograma Gantt de condicionantes, alertas automáticos, licenças por categoria (AUT, LP, LI, LO, RLO, PLI, CP, LS) e agenda (calendário) |
| **Licenças** | Cadastro, edição, exclusão e histórico das licenças, com os 8 tipos e condicionantes vinculadas |
| **Prazos e Demandas** | Demandas e prazos unificados, com responsável, prioridade, status e alertas |
| **Evidências** | Upload (imagem/doc/vídeo) e captura no app, com **geolocalização automática** (lat, long, data, hora, usuário) e mini-mapa |
| **Assistente IA** | Chat moderno com histórico e anexos: envie o PDF/imagem de uma licença e a IA extrai tipo, órgão, processo, validade e condicionantes, **preenche o cadastro** e **exporta para Excel** |

```bash
# basta abrir; recomendado servir via http
python3 -m http.server 8080
# depois acesse  http://localhost:8080/gml.html
```

> A interface funciona **offline** (apenas a fonte Hanken Grotesk vem do Google Fonts).
>
> **Leitura de licenças por IA (OCR/visão):** em **⚙ Configurar IA** informe sua chave da
> API Anthropic (`sk-ant-…`, salva apenas no navegador). Ao anexar um **PDF ou imagem** de
> licença, o app chama a **API do Claude** (`claude-opus-4-8`) com visão/PDF e extração
> estruturada (JSON), preenche o cadastro e exporta para Excel. Sem chave, o exemplo opera
> em **modo demonstração** com extração simulada.
>
> ⚠️ A chamada é feita direto do navegador (com `anthropic-dangerous-direct-browser-access`).
> Isso expõe a chave — **em produção, faça a chamada por um backend**.

---

## 🧭 Telas / Módulos

| Tela | Arquivo | Responde a |
|------|---------|------------|
| **Login / Marca** | `index.html` | Identidade visual e proposta de valor |
| **Dashboard Executivo** | `dashboard.html` | KPIs, conformidade, evolução, **heatmap de risco**, prazos críticos |
| **Licenças & Condicionantes** | `licencas.html` | Carteira ambiental, status semafórico, filtros, progresso |
| **Prazos & Alertas** | `prazos.html` | Gestão preventiva, agenda por urgência, alertas automáticos |
| **Evidências** | `evidencias.html` | Galeria de evidências **vinculadas** a cada condicionante |
| **Matriz de Responsabilidade** | `matriz.html` | RACI: quem responde por quê (governança e rastreabilidade) |
| **Mapa & GIS** | `mapa.html` | Georreferenciamento de pontos, áreas e evidências |
| **Assistente IA** | `assistente.html` | Respostas sob pressão com **fonte citada** (Demanda → Resposta segura) |
| **App de Campo** | `mobile.html` | Mockup mobile: registro **offline**, GPS automático, sincronização |

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
cards com bordas suaves, ícones minimalistas, gráficos em azul/amarelo e indicadores de risco
em **sistema semafórico** (verde · amarelo · vermelho).

---

## 🗂️ Estrutura

```
.
├── index.html            # Login / showcase da marca
├── dashboard.html        # Dashboard executivo
├── licencas.html         # Licenças & condicionantes
├── prazos.html           # Prazos & alertas
├── evidencias.html       # Evidências
├── matriz.html           # Matriz de responsabilidade (RACI)
├── mapa.html             # Mapa & GIS
├── assistente.html       # Assistente de IA
├── mobile.html           # App de campo (mockup)
└── assets/
    ├── css/styles.css    # Design system completo (tokens da paleta)
    └── js/
        ├── icons.js      # Conjunto de ícones SVG + hidratação
        ├── data.js       # Base de dados de demonstração (fictícia)
        ├── charts.js     # Gráficos em SVG/CSS (donut, barras, linha, heatmap)
        └── app.js        # Shell (sidebar + topbar) e interações
```

## 🛠️ Tecnologia

HTML5 + CSS3 + JavaScript puro (sem frameworks, sem build, sem dependências).
A barra lateral e a barra superior são injetadas por `app.js` em todas as páginas,
mantendo consistência visual. Gráficos desenhados em SVG/CSS — funcionam offline.

> ⚠️ Dados exibidos são **fictícios**, para fins de demonstração do conceito visual.
