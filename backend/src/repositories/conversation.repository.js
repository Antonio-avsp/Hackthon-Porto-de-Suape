// ============================================================
// Repositório de conversas do assistente.
// Implementação em memória (volátil) — isola a persistência por trás de
// uma interface estável. Para usar um banco real (ex.: via DATABASE_URL),
// basta criar outra implementação com os mesmos métodos.
// ============================================================
import { randomUUID } from 'node:crypto';

const store = new Map();

export const conversationRepository = {
  /** Cria uma nova conversa e retorna seu id. */
  create() {
    const id = randomUUID();
    store.set(id, { id, messages: [], createdAt: new Date().toISOString() });
    return id;
  },

  /** Recupera uma conversa pelo id (ou null). */
  findById(id) {
    return store.get(id) || null;
  },

  /** Acrescenta uma mensagem à conversa, criando-a se necessário. */
  appendMessage(id, message) {
    let conv = store.get(id);
    if (!conv) {
      conv = { id, messages: [], createdAt: new Date().toISOString() };
      store.set(id, conv);
    }
    conv.messages.push({ ...message, at: new Date().toISOString() });
    return conv;
  },

  /** Remove uma conversa. */
  delete(id) {
    return store.delete(id);
  },
};

export default conversationRepository;
