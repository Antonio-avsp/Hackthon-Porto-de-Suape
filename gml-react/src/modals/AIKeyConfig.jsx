import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../store.jsx';
import { getKey, setKey } from '../lib/ai.js';

export default function AIKeyConfig() {
  const { closeModal, toast } = useStore();
  const [val, setVal] = useState(getKey());

  const save = () => {
    setKey(val.trim());
    toast(val.trim() ? 'Chave salva ✓' : 'Chave removida');
    closeModal();
  };

  return (
    <Modal onClose={closeModal}>
      <div className="modal-head"><h3>Configurar IA · OCR / Visão</h3><button className="close" onClick={closeModal}>×</button></div>
      <div className="modal-body">
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          A leitura real de licenças usa a <b>API do Claude (Anthropic)</b> com visão e PDF (modelo <code>claude-opus-4-8</code>). Informe sua chave <code>sk-ant-…</code> — ela fica salva <b>apenas neste navegador</b>.
        </div>
        <div className="field"><label>Chave da API Anthropic</label><input type="password" value={val} onChange={(e) => setVal(e.target.value)} placeholder="sk-ant-api03-…" /></div>
        <div style={{ background: '#FFF7E6', border: '1px solid #F5D58A', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#7a5b12', lineHeight: 1.5 }}>
          ⚠️ <b>Em produção, chame a API por um backend.</b> A chave usada direto no navegador fica exposta a qualquer pessoa com acesso à página.
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Salvar chave</button>
      </div>
    </Modal>
  );
}
