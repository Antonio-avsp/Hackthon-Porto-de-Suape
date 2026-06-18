import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../icons.jsx';
import { Sigla, Dot } from '../ui.jsx';
import { tipoCor } from '../data.js';
import { useStore } from '../store.jsx';
import { buildSampleExtract, exportExcel, sleep } from '../lib/ai.js';
import { extractLicense, chatWithAI } from '../lib/api.js';

const HIST = [
  { t: 'Leitura LO-2023-045', s: 'Hoje · extração concluída' },
  { t: 'Renovação outorga APAC', s: 'Ontem' },
  { t: 'LI Terminal de granéis', s: '12 mai' },
];

function ExtractCard({ d, onFill, onExcel }) {
  return (
    <div className="extract">
      <div className="eh"><Icon name="spark" /><div><b style={{ fontSize: 13.5 }}>Licença interpretada</b><div style={{ fontSize: 11.5, opacity: .85 }}>Extração automática concluída</div></div></div>
      <div className="eb">
        <div className="kv"><div className="k">Tipo</div><div className="v"><Sigla sigla={d.sigla} color={tipoCor(d.sigla)} style={{ minWidth: 38, height: 22 }} /> {d.tipo}</div></div>
        <div className="kv"><div className="k">Órgão emissor</div><div className="v">{d.orgao}</div></div>
        <div className="kv"><div className="k">Nº do processo</div><div className="v">{d.processo}</div></div>
        <div className="kv"><div className="k">Validade</div><div className="v">{d.validade}</div></div>
        <div className="kv"><div className="k">Classificação</div><div className="v" style={{ color: d.riscoCor, fontWeight: 800 }}>{d.risco}</div></div>
        <div className="kv"><div className="k">Resumo</div><div className="v" style={{ fontWeight: 500 }}>{d.resumo}</div></div>
        <div className="ecard-conds">
          <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--cinza)', fontWeight: 800 }}>{d.cond.length} condicionantes identificadas</div>
          {d.cond.map((c, i) => (
            <div className="c" key={i}><Dot color={c.cor} style={{ marginTop: 5 }} /><div><b>{c.descricao}</b><div className="muted" style={{ fontSize: 11 }}>{c.periodicidade} · prazo {c.prazo} · risco {c.risco}</div></div></div>
          ))}
        </div>
      </div>
      <div className="ecard-acts">
        <button className="btn btn-primary btn-sm" onClick={onFill}><Icon name="check" /> Preencher cadastro de licença</button>
        <button className="btn btn-ghost btn-sm" onClick={onExcel}><Icon name="excel" /> Exportar para Excel</button>
      </div>
    </div>
  );
}

let mid = 0;
const nid = () => ++mid;

export default function AssistenteIA() {
  const { upsertFromExtract, setScreen, openModal, toast } = useStore();
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [text, setText] = useState('');
  const fileRef = useRef(null);
  const msgsRef = useRef(null);
  const taRef = useRef(null);

  const append = useCallback((m) => setMessages((x) => [...x, { _id: nid(), ...m }]), []);
  const popTyping = useCallback(() => setMessages((x) => x.filter((m) => !m.typing)), []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  const fillCadastro = useCallback((d) => {
    const id = upsertFromExtract(d);
    toast('Cadastro de licença preenchido pela IA ✓');
    append({ role: 'bot', html: `Pronto! Atualizei o cadastro da licença <b>${id || d.sigla}</b> com ${d.cond.length} condicionantes. Abrindo a aba <b>Licenças</b>…` });
    setTimeout(() => setScreen('licencas'), 800);
  }, [upsertFromExtract, toast, append, setScreen]);

  // Conversa de texto: envia o prompt + histórico ao backend (Gemini).
  async function sendChat(prompt) {
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'bot') && typeof m.text === 'string' && m.text)
      .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', text: m.text }));
    append({ typing: true });
    try {
      const reply = await chatWithAI(prompt, history);
      popTyping();
      append({ role: 'bot', text: reply });
    } catch (err) {
      popTyping();
      if (err && err.connection) {
        append({ role: 'bot', html: 'Não consegui falar com o <b>backend de IA</b>. Verifique se ele está rodando (porta 3333) e a URL em <b>⚙ Configurar IA</b>.' });
        return openModal('aiKey');
      }
      append({ role: 'bot', html: `⚠️ A IA não respondeu agora (<code>${(err && err.message) || 'erro'}</code>). Tente novamente em instantes.` });
    }
  }

  async function simulateExtraction(filename) {
    append({ role: 'user', text: 'Leia esta licença de exemplo e cadastre para mim.', file: filename });
    append({ typing: true });
    await sleep(1300);
    popTyping();
    append({ role: 'bot', html: '<i>(modo demonstração)</i> Identifiquei uma <b>Licença de Operação</b> da <b>CPRH</b>. Estruturei os dados abaixo:' });
    append({ extract: buildSampleExtract() });
    append({ role: 'bot', html: 'Posso <b>preencher o cadastro</b> ou <b>exportar para Excel</b>. Para ler um <b>arquivo real</b> (PDF/imagem), anexe-o com 📎 — o <b>backend GML</b> faz a leitura via IA.' });
  }

  async function processDocument(file) {
    append({ role: 'user', text: 'Leia esta licença e cadastre para mim.', file: file.name });
    append({ typing: true });
    try {
      const d = await extractLicense(file);
      popTyping();
      append({ role: 'bot', html: `Li o arquivo <b>${file.name}</b> via backend (IA) e identifiquei uma <b>${d.tipo}</b> do órgão <b>${d.orgao}</b>. Dados extraídos:` });
      append({ extract: d });
      append({ role: 'bot', html: 'Posso <b>preencher o cadastro</b> automaticamente ou <b>exportar para Excel</b> — é só clicar acima. ✅' });
    } catch (err) {
      popTyping();
      if (err && err.connection) {
        append({ role: 'bot', html: 'Não consegui falar com o <b>backend de IA</b>. Verifique se ele está rodando e a URL em <b>⚙ Configurar IA</b>. Abrindo a configuração…' });
        return openModal('aiKey');
      }
      append({ role: 'bot', html: `⚠️ Não consegui processar o arquivo (<code>${(err && err.message) || 'erro'}</code>). Segue uma extração <i>simulada</i>:` });
      append({ extract: buildSampleExtract() });
    }
  }

  async function handleSug(kind) {
    if (kind === 'exemplo') return simulateExtraction('Licenca_Operacao_045-2023_CPRH.pdf');
  }

  async function doSend() {
    if (attachments.length) {
      const f = attachments[0];
      setAttachments([]);
      setText('');
      if (taRef.current) taRef.current.style.height = 'auto';
      return processDocument(f);
    }
    const t = text.trim();
    if (!t) return;
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
    append({ role: 'user', text: t });
    await sendChat(t);
  }

  const onPick = (e) => {
    if (!e.target.files.length) return;
    setAttachments([e.target.files[0]]);
    e.target.value = '';
    toast('Arquivo anexado — clique em enviar para a IA ler');
  };

  return (
    <div className="view">
      <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={onPick} />
      <div className="ai-wrap">
        <div className="ai-hist">
          <div className="nh">
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => { setMessages([]); setAttachments([]); }}><Icon name="plus" /> Nova conversa</button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => openModal('aiKey')}><Icon name="gear" /> Configurar IA</button>
          </div>
          <div style={{ padding: '8px 4px', flex: 1, overflow: 'auto' }}>
            <div className="ai-conv on">Conversa atual<small>Assistente de licenças</small></div>
            {HIST.map((h, i) => <div className="ai-conv" key={i}>{h.t}<small>{h.s}</small></div>)}
          </div>
        </div>
        <div className="ai-main">
          <div className="ai-msgs" ref={msgsRef}>
            {messages.length === 0 ? (
              <div className="ai-empty">
                <div className="spark"><Icon name="spark" /></div>
                <h3 style={{ color: 'var(--tinta)', fontSize: 17, margin: '0 0 6px' }}>Assistente de Licenças GML</h3>
                <p style={{ margin: 0 }}>
                  Anexe o <b>PDF</b> ou a <b>imagem</b> de uma licença (botão 📎). A IA lê o documento por <b>OCR/visão</b>, identifica tipo, órgão, processo, validade e condicionantes — e cadastra a licença automaticamente.<br />
                  <span style={{ fontSize: 11.5 }}>A leitura e o chat usam o <b>backend GML</b> (Gemini). Configure a URL em <b>⚙ Configurar IA</b>.</span>
                </p>
                <div className="ai-suggest">
                  <button onClick={() => handleSug('exemplo')}>📄 Ler licença de exemplo (demo)</button>
                  <button onClick={() => fileRef.current.click()}>📎 Anexar PDF/imagem real</button>
                  <button onClick={() => openModal('aiKey')}>⚙ Configurar chave da API</button>
                </div>
              </div>
            ) : messages.map((m) => {
              if (m.typing) return (
                <div className="msg bot" key={m._id}><div className="ava" style={{ background: 'linear-gradient(135deg,#356bbd,#234E91)' }}>IA</div><div className="bub"><div className="typing"><span /><span /><span /></div></div></div>
              );
              if (m.extract) return (
                <div className="msg bot" key={m._id}><div className="ava" style={{ background: 'linear-gradient(135deg,#356bbd,#234E91)' }}>IA</div><div className="bub" style={{ padding: 0, background: 'transparent', border: 0, boxShadow: 'none' }}><ExtractCard d={m.extract} onFill={() => fillCadastro(m.extract)} onExcel={() => { exportExcel(m.extract); toast('Planilha Excel gerada ✓'); }} /></div></div>
              );
              const isUser = m.role === 'user';
              return (
                <div className={'msg ' + (isUser ? 'user' : 'bot')} key={m._id}>
                  <div className="ava" style={isUser ? { background: 'var(--amarelo)', color: '#1B2A4A' } : { background: 'linear-gradient(135deg,#356bbd,#234E91)' }}>{isUser ? 'MA' : 'IA'}</div>
                  <div className="bub">
                    {m.file ? <div className="file"><Icon name="doc" /> {m.file}</div> : null}
                    {m.html ? <span dangerouslySetInnerHTML={{ __html: m.html }} /> : <span>{m.text}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ai-composer">
            <div className="ai-attach">
              {attachments.map((f, i) => (
                <div className="ai-chip" key={i}><Icon name="doc" /> {f.name}<button onClick={() => setAttachments([])}>×</button></div>
              ))}
            </div>
            <div className="ai-inputbar">
              <button className="icon-btn" title="Anexar arquivo" onClick={() => fileRef.current.click()}><Icon name="clip" /></button>
              <textarea
                ref={taRef}
                rows={1}
                value={text}
                placeholder="Pergunte algo ou envie o PDF/imagem de uma licença para a IA cadastrar…"
                onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } }}
              />
              <button className="send" title="Enviar" onClick={doSend}><Icon name="send" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
