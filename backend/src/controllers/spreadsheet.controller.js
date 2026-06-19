// ============================================================
// Controller da Planilha de Controle (.xlsx) — automação.
// Gera o arquivo a partir da FONTE ÚNICA DE VERDADE (repositório) e o entrega
// para download. O arquivo é uma PROJEÇÃO do estado — sempre atualizado.
// ============================================================
import asyncHandler from '../utils/asyncHandler.js';
import { gerarBuffer } from '../services/spreadsheet.service.js';
import environmentalRepository from '../repositories/environmental.repository.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const spreadsheetController = {
  /** GET /api/spreadsheet/controle.xlsx — baixa a planilha preenchida. */
  downloadControle: asyncHandler(async (_req, res) => {
    const state = environmentalRepository.getState();
    const buf = await gerarBuffer(state);
    const nome = `Controle_de_Licencas_GML_${new Date().getFullYear()}.xlsx`;
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Length', buf.length);
    return res.status(200).send(buf);
  }),
};

export default spreadsheetController;
