import { renderCanvas } from "./rankCardCanvas.js";
import { renderFfmpeg } from "./rankCardFfmpeg.js";

/**
 * @typedef {import("./rankCardCanvas.js").RankCardInput} RankCardInput
 */

/**
 * Gera O Banner De Nível. Tenta Primeiro Com @napi-rs/canvas (Mais Bonito,
 * Com Texto Desenhado Na Imagem); Se Der Qualquer Erro — Pacote Ausente,
 * Erro De Dlopen No Termux, Etc — Cai Automaticamente Pro Gerador Via
 * Ffmpeg, Que É Mais Simples Mas Garantido De Funcionar.
 * @param {RankCardInput} input
 * @returns {Promise<{ buffer: Buffer, engine: "canvas"|"ffmpeg" }>}
 */
export async function renderRankCard(input) {
    try {
        const buffer = await renderCanvas(input);
        return {
            buffer,
            engine: "canvas"
        }
    } catch (e) {
        const buffer = await renderFfmpeg(input);
        return {
            buffer,
            engine: "ffmpeg"
        }
    }
}