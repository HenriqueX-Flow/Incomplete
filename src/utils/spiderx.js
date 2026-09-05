/**
 * SpiderXAPI (https://api.spiderx.com.br) API Para Bots Com Diversas Funcionalidades.
 */

const PLAY_AUDIO_PATH = "/api/downloads/play-audio";
const PLAY_VIDEO_PATH = "/api/downloads/play-video";

/**
 * @typedef {Object} SpiderxConfig
 * @property {string} token
 * @property {string} baseUrl
 */

/**
 * @typedef {Object} SpiderxMediaResult
 * @property {string} title
 * @property {string} description
 * @property {string} thumbnail
 * @property {number} durationSeconds
 * @property {string} url - Link Direto Do Arquivo (mp3/mp4) Já Pronto
 * @property {string} youtubeUrl - Link Original Do Vídeo No YouTube 
 * @property {{ name: string, url: string }} channel
 */

/**
 * Verifica Se O Token Da SpiderX Tá Configurado.
 * @param {SpiderxConfig} cfg
 * @returns {boolean}
 */
export function hasSpiderxToken(cfg) {
    return !!cfg?.token && cfg.token.trim().length > 0;
}

/**
 * @param {SpiderxConfig} cfg
 * @param {string} path
 * @param {Object.<string, string>} params
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
async function spiderxGet(cfg, path, params, timeoutMs = 25000) {
    const url = new URL(path, cfg.baseUrl);
    url.searchParams.set("api_key", cfg.token);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || json?.error || `SpiderX Respondeu ${res.status}`);
        return json;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * @param {any} data
 * @returns {SpiderxMediaResult}
 */
function normalize(data) {
    return {
        title: data.title || "",
        description: data.description || "",
        thumbnail: data.thumbnail || "",
        durationSeconds: data.total_duration_in_seconds || 0,
        url: data.url,
        youtubeUrl: data.youtube_video_url || "",
        channel: {
            name: data.channel?.name || "",
            url: data.channel?.url || ""
        }
    }
}

/**
 * Busca Um Áudio No YouTube Por Termo De Pesquisa.
 * @param {SpiderxConfig} cfg
 * @param {string} search - Termo De Pesquisa (Não Link)
 * @returns {Promise<SpiderxMediaResult>}
 */
export async function spiderxPlayAudio(cfg, search) {
    const data = await spiderxGet(cfg, PLAY_AUDIO_PATH, {
        search
    });
    return normalize(data);
}

/**
 * Busca Um Vídeo No YouTube Por Termo De Pesquisa.
 * @param {SpiderxConfig} cfg
 * @param {string} search - Termo De Pesquisa (Não Link)
 * @returns {Promise<SpiderxMediaResult>}
 */
export async function spiderxPlayVideo(cfg, search) {
    const data = await spiderxGet(cfg, PLAY_VIDEO_PATH, {
        search
    });
    return normalize(data);
}