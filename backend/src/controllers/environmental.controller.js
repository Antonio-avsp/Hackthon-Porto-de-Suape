// ============================================================
// Controller do estado ambiental (Fase 3) — expõe a fonte única de verdade
// do servidor (licenças/demandas/evidências) ao frontend. Toda a mutação é
// aplicada e PERSISTIDA no backend; o assistente de IA lê deste mesmo estado.
// ============================================================
import { success } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import repo from '../repositories/environmental.repository.js';

export const environmentalController = {
  /** GET /api/environmental/state — estado completo (semeado no 1º acesso). */
  getState: asyncHandler(async (_req, res) => success(res, repo.getState())),

  /** POST /api/environmental/licencas — cria/atualiza uma licença (por id). */
  addLicenca: asyncHandler(async (req, res) => {
    const lic = req.body || {};
    if (!lic.id || !lic.sigla) throw ApiError.badRequest('Licença precisa de "id" e "sigla".');
    return success(res, { license: repo.addLicenca(lic) }, { status: 201 });
  }),

  /** PATCH /api/environmental/licencas/:id — atualização parcial. */
  updateLicenca: asyncHandler(async (req, res) => {
    const updated = repo.updateLicenca(req.params.id, req.body || {});
    if (!updated) throw ApiError.notFound(`Licença "${req.params.id}" não encontrada.`);
    return success(res, { license: updated });
  }),

  /** DELETE /api/environmental/licencas/:id */
  deleteLicenca: asyncHandler(async (req, res) => {
    const ok = repo.deleteLicenca(req.params.id);
    if (!ok) throw ApiError.notFound(`Licença "${req.params.id}" não encontrada.`);
    return success(res, { deleted: req.params.id });
  }),

  /** POST /api/environmental/licencas/extract-upsert — cadastra a partir de OCR. */
  upsertFromExtract: asyncHandler(async (req, res) => {
    const { license, created } = repo.upsertFromExtract(req.body || {});
    return success(res, { license, created }, { status: created ? 201 : 200 });
  }),

  /** PUT /api/environmental/demandas — substitui a coleção de demandas. */
  replaceDemandas: asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body?.demandas)) throw ApiError.badRequest('Envie { "demandas": [...] }.');
    return success(res, { demandas: repo.replaceDemandas(req.body.demandas) });
  }),

  /** PUT /api/environmental/evidencias — substitui a coleção de evidências. */
  replaceEvidencias: asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body?.evidencias)) throw ApiError.badRequest('Envie { "evidencias": [...] }.');
    return success(res, { evidencias: repo.replaceEvidencias(req.body.evidencias) });
  }),
};

export default environmentalController;
