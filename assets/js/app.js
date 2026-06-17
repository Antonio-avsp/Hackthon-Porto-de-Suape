/* ============================================================
   SENTINELA — Shell da aplicação (sidebar + topbar)
   Injeta a estrutura comum em todas as páginas internas.
   ============================================================ */

const BRAND_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2E60AD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 12c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 19.5 4 17 4 12V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  <path d="M14.5 9.2c-2.2.4-3.2 1.9-3.2 4.3 0 .9.2 1.6.5 2.2" stroke="#28A745"/>
  <path d="M9 14.7c1.3-2.7 2.6-3.8 5.5-4.2" stroke="#28A745"/>
</svg>`;

const NAV = [
  { group: 'Gestão', items: [
    { key:'dashboard',  label:'Dashboard',                  icon:'dashboard',  href:'dashboard.html' },
    { key:'licencas',   label:'Licenças & Condicionantes',  icon:'file-check', href:'licencas.html' },
    { key:'prazos',     label:'Prazos & Alertas',           icon:'alarm',      href:'prazos.html', badge:'7', badgeRed:true },
    { key:'evidencias', label:'Evidências',                 icon:'camera',     href:'evidencias.html' },
  ]},
  { group: 'Inteligência', items: [
    { key:'matriz',     label:'Matriz de Responsabilidade', icon:'users',      href:'matriz.html' },
    { key:'mapa',       label:'Mapa & GIS',                 icon:'map-pin',    href:'mapa.html' },
    { key:'assistente', label:'Assistente IA',              icon:'sparkles',   href:'assistente.html', badge:'IA' },
  ]},
  { group: 'Mobilidade', items: [
    { key:'mobile',     label:'App de Campo',               icon:'smartphone', href:'mobile.html' },
  ]},
];

function buildSidebar(active){
  let nav = '';
  NAV.forEach(g => {
    nav += `<div class="nav-group-label">${g.group}</div>`;
    g.items.forEach(it => {
      const on = it.key === active ? ' is-active' : '';
      const badge = it.badge
        ? `<span class="badge-dot${it.badgeRed?' red':''}">${it.badge}</span>` : '';
      nav += `<a class="nav-item${on}" href="${it.href}">
                <span data-icon="${it.icon}"></span><span>${it.label}</span>${badge}
              </a>`;
    });
  });
  return `<aside class="sidebar">
    <div class="sidebar__brand">
      <div class="brand-mark">${BRAND_SVG}</div>
      <div class="brand-text"><b>Sentinela</b><span>Governança Ambiental</span></div>
    </div>
    <nav class="sidebar__nav">${nav}
      <div class="nav-group-label">Sistema</div>
      <a class="nav-item" href="#"><span data-icon="settings"></span><span>Configurações</span></a>
    </nav>
    <div class="sidebar__foot">
      <div class="side-user">
        <div class="avatar">AC</div>
        <div class="meta"><b>Ana Carvalho</b><span>Coord. Meio Ambiente</span></div>
        <span data-icon="logout" style="margin-left:auto;opacity:.7"></span>
      </div>
    </div>
  </aside>`;
}

function buildTopbar(title, sub){
  return `<header class="topbar">
    <div class="topbar__title">
      <h1>${title||'Dashboard'}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
    </div>
    <div class="topbar__spacer"></div>
    <label class="searchbox">
      <span data-icon="search"></span>
      <input placeholder="Buscar licença, condicionante, protocolo…">
      <kbd>⌘K</kbd>
    </label>
    <a class="btn btn--primary btn--sm" href="#"><span data-icon="plus" data-size="16"></span> Nova demanda</a>
    <button class="icon-btn" title="Notificações"><span data-icon="bell"></span><span class="dot"></span></button>
    <div class="avatar amber">AC</div>
  </header>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('.app');
  if (app) {
    const active = app.dataset.page;
    const title  = app.dataset.title;
    const sub    = app.dataset.sub;
    app.insertAdjacentHTML('afterbegin', buildSidebar(active));
    const main = app.querySelector('.main');
    if (main) main.insertAdjacentHTML('afterbegin', buildTopbar(title, sub));
  }
  hydrateIcons(document);
  initInteractions();
});

/* ------- pequenas interações de protótipo ------- */
function initInteractions(){
  // Tabs / segmented controls
  document.querySelectorAll('[data-tabs]').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      group.querySelectorAll('button[data-tab]').forEach(b => b.classList.toggle('is-active', b===btn));
      const scope = group.getAttribute('data-tabs');
      document.querySelectorAll(`[data-pane="${scope}"]`).forEach(p => {
        p.style.display = (p.getAttribute('data-tab-value') === btn.dataset.tab) ? '' : 'none';
      });
    });
  });
  // Toggles (switches) — alternam estado visual
  document.addEventListener('click', e => {
    const sw = e.target.closest('.switch');
    if (sw) sw.classList.toggle('off');
  });
  // Filtros de tabela por status (data-filter)
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      group.querySelectorAll('button[data-filter]').forEach(b => b.classList.toggle('is-active', b===btn));
      const f = btn.dataset.filter;
      const scope = group.getAttribute('data-filter-group');
      document.querySelectorAll(`[data-row-scope="${scope}"]`).forEach(row => {
        row.style.display = (f === 'all' || row.dataset.status === f) ? '' : 'none';
      });
    });
  });
}
