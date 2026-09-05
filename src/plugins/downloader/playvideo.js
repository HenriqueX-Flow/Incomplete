import {
    hasSpiderxToken,
    spiderxPlayVideo
} from "#utils/spiderx.js";
import { runtime } from "#core/utils.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["playvideo", "pv"],
    use: "(nome do vídeo)",
    category: "downloader",
    run: async (m, {
        client,
        config,
        text
    }) => {
        const spiderx = config.spiderx || {}

        if (!hasSpiderxToken(spiderx)) {
            return m.reply(`Este Comando Precisa De Um Token Da SpiderX No config.json (spiderx.token). Mais Info: ${spiderx.baseUrl || "https://api.spiderx.com.br"}`)
        }

        if (!text) return m.reply("Você Precisa Digitar O Nome Do Vídeo.")

        try {
            const result = await spiderxPlayVideo(spiderx, text)
            if (!result.url) throw new Error("Nenhum resultado encontrado")

            const caption = `🎬 *${result.title}*\n` + (result.channel.name ? `📺 ${result.channel.name}\n` : "") + (result.durationSeconds ? `⏱️ ${runtime(result.durationSeconds * 1000)}` : "")

            await client.sendMessage(m.chat, {
                video: { url: result.url },
                caption,
                mimetype: "video/mp4"
            }, {
                quoted: m.raw
            })
        } catch (e) {
            await m.reply(`Erro Ao Tentar Baixar: ${e.message}`)
        }
    }
}