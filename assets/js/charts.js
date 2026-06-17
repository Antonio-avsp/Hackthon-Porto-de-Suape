/* ============================================================
   SENTINELA — Gráficos em SVG/CSS puro (sem dependências)
   ============================================================ */

/* Donut / rosca com texto central opcional */
function donut(segments, opts){
  opts = opts || {};
  const size = opts.size || 190, thickness = opts.thickness || 24;
  const r = (size - thickness) / 2, cx = size/2, C = 2 * Math.PI * r;
  const total = segments.reduce((s,x)=>s+x.value,0) || 1;
  let acc = 0, arcs = '';
  segments.forEach(seg => {
    const len = seg.value/total * C;
    arcs += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${seg.color}"
      stroke-width="${thickness}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"
      stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"/>`;
    acc += len;
  });
  const center = opts.center
    ? `<text x="50%" y="47%" text-anchor="middle" font-size="${size*0.21}" font-weight="800" fill="#1f2a37">${opts.center.main}</text>
       <text x="50%" y="62%" text-anchor="middle" font-size="${size*0.078}" font-weight="700" fill="#6C757D" letter-spacing=".04em">${opts.center.sub||''}</text>`
    : '';
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#eef1f6" stroke-width="${thickness}"/>
    ${arcs}${center}</svg>`;
}

/* Barras verticais (HTML/CSS) */
function barsHTML(data, opts){
  opts = opts || {};
  const h = opts.height || 180;
  const max = opts.max || Math.max.apply(null, data.map(d=>d.value).concat([1]));
  return `<div class="bars" style="height:${h}px">` + data.map(d=>{
    const pct = Math.max(2, Math.round(d.value/max*100));
    return `<div class="bar-col" title="${d.label}: ${d.value}">
      <div class="bar-val">${opts.format ? opts.format(d.value) : d.value}</div>
      <div class="bar-track"><div class="bar-fill" style="height:${pct}%;background:${d.color||'var(--blue)'}"></div></div>
      <div class="bar-x">${d.label}</div>
    </div>`;
  }).join('') + `</div>`;
}

/* Linha + área (responsivo via viewBox) */
function lineArea(points, opts){
  opts = opts || {};
  const W = 600, H = opts.height || 190, pad = 14, padB = 26;
  const color = opts.color || '#2E60AD';
  const fill  = opts.fill  || 'rgba(46,96,173,.10)';
  const max = (opts.max || Math.max.apply(null, points)) * 1.18 || 1;
  const stepX = (W - pad*2) / (points.length - 1);
  const xy = points.map((p,i)=>[pad + i*stepX, (H-padB) - (p/max)*(H-padB-pad)]);
  const line = xy.map((c,i)=>(i?'L':'M')+c[0].toFixed(1)+' '+c[1].toFixed(1)).join(' ');
  const area = line + ` L ${xy[xy.length-1][0].toFixed(1)} ${H-padB} L ${xy[0][0].toFixed(1)} ${H-padB} Z`;
  const dots = xy.map(c=>`<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2.5"/>`).join('');
  const labels = (opts.labels||[]).map((l,i)=>`<text x="${(pad+i*stepX).toFixed(1)}" y="${H-7}" text-anchor="middle" font-size="11" fill="#868e96" font-weight="600">${l}</text>`).join('');
  const grid = [0.25,0.5,0.75].map(g=>{const y=pad+g*(H-padB-pad);return `<line x1="${pad}" x2="${W-pad}" y1="${y}" y2="${y}" stroke="#eef1f6" stroke-width="1"/>`;}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" style="overflow:visible">
    <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${fill}"/><stop offset="100%" stop-color="rgba(46,96,173,0)"/>
    </linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#lg)"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}${labels}</svg>`;
}

/* Sparkline compacta */
function sparkline(points, color){
  const W=120,H=34,p=3; color=color||'#2E60AD';
  const max=Math.max.apply(null,points)||1, stepX=(W-p*2)/(points.length-1);
  const d=points.map((v,i)=>(i?'L':'M')+(p+i*stepX).toFixed(1)+' '+((H-p)-(v/max)*(H-p*2)).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* Barra horizontal empilhada (status) */
function stackBar(segments){
  const total = segments.reduce((s,x)=>s+x.value,0)||1;
  return `<div class="stack-bar">` + segments.map(s=>
    `<span style="width:${(s.value/total*100).toFixed(1)}%;background:${s.color}" title="${s.label}: ${s.value}"></span>`
  ).join('') + `</div>`;
}

/* Escala de cor para heatmap de risco (0 baixo -> 1 alto) */
function riskColor(v){
  if (v >= 0.75) return '#DC3545';
  if (v >= 0.5)  return '#FCB316';
  if (v >= 0.25) return '#f0d264';
  return '#28A745';
}
