import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../store.jsx';
import { getApiBase, setApiBase, checkHealth } from '../lib/api.js';

export default function AIKeyConfig() {
  const { closeModal, toast } = useStore();
  const [val, setVal] = useState(getApiBase());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { ok, msg }

  const test = async () => {
    setApiBase(val.trim());
    setTesting(true);
    setStatus(null);
    try {
      const health = await checkHealth();
      const ai = health?.ai || {};
      setStatus({
        ok: ai.available,
        msg: ai.available
          ? `Conectado ✓ — IA pronta (modelo ${ai.model}).`
          : `Backend online, mas a IA está indisponível (GEMINI_API_KEY não configurada no servidor).`,
      });
    } catch (err) {
      setStatus({ ok: false, msg: err.connection ? 'Não foi possível conectar — verifique se o backend está rodando.' : (err.message || 'Falha ao testar.') });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    setApiBase(val.trim());
    toast(val.trim() ? 'Backend de IA configurado ✓' : 'URL do backend restaurada para o padrão');
    closeModal();
  };

  return (
    <Modal onClose={closeModal}>
      <div className="modal-head"><h3>Configurar IA · Conexão com o backend</h3><button className="close" onClick={closeModal}>×</button></div>
      <div className="modal-body">
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          A leitura de licenças e o chat usam o <b>backend GML</b>, que conversa com o <b>Gemini</b> com a chave protegida no servidor. Informe a URL do backend (padrão <code>http://localhost:3333</code>).
        </div>
        <div className="field"><label>URL do backend</label><input type="text" value={val} onChange={(e) => setVal(e.target.value)} placeholder="http://localhost:3333" /></div>
        {status ? (
          <div style={{
            background: status.ok ? '#E9F7EE' : '#FFF7E6',
            border: `1px solid ${status.ok ? '#9FD9B4' : '#F5D58A'}`,
            borderRadius: 10, padding: '10px 12px', fontSize: 11.5,
            color: status.ok ? '#1c6b39' : '#7a5b12', lineHeight: 1.5,
          }}>
            {status.ok ? '✅ ' : '⚠️ '}{status.msg}
          </div>
        ) : (
          <div style={{ background: '#F0F4FB', border: '1px solid #CADBF2', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#2E60AD', lineHeight: 1.5 }}>
            🔒 A chave da IA fica <b>somente no servidor</b> — nunca é exposta ao navegador.
          </div>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={test} disabled={testing}>{testing ? 'Testando…' : 'Testar conexão'}</button>
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </div>
    </Modal>
  );
}
