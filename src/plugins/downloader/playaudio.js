import {
    hasSpiderxToken,
    spiderxPlayAudio
} from "#utils/spiderx.js";
import { runtime } from "#core/utils.js";

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["playaudio", "play"],
    use: "(nome da música)",
    category: "downloader",
    run: async (m, {
        client,
        config,
        text
    }) => {
        const spiderx = config.spiderx || {};

        if (!hasSpiderxToken(spiderx)) {
            return m.reply(`Este Comando Precisa De Um Token Da SpiderX No config.json (spiderx.token). Mais Info: ${spiderx.baseUrl || "https://api.spiderx.com.br"}`);
        }

        if (!text) return m.reply("Você Precisa Digitar O Nome Da Música.");

        try {
            const result = await spiderxPlayAudio(spiderx, text)
            if (!result.url) throw new Error("Nenhum Resultado Encontrado")

            const caption = `🎵 *${result.title}*\n` + (result.channel.name ? `📺 ${result.channel.name}\n` : "") + (result.durationSeconds ? `⏱️ ${runtime(result.durationSeconds * 1000)}` : "");

            await client.sendMessage(m.chat, {
                audio: { url: result.url },
                mimetype: "audio/mpeg",
                ptt: false
            }, {
                quoted: m.raw
            })
            await m.reply(caption)
        } catch (e) {
            await m.reply(`Erro Ao Tentar Baixar: ${e.message}`);
        }
    }
}