import { toWebp, addExif } from "#whatsapp/convert.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["s", "sticker", "figurinha", "sticker-round", "sticker-circular", "stickerredondo"],
    use: "(Marca Uma Imagem Ou Vídeo Curto)",
    category: "convert",
    run: async (m, { client, config, command }) => {
        const type = client.hasMedia(m.raw);
        if (!type || !["image", "video"].includes(type)) {
            return m.reply("Marca Uma Imagem Ou Vídeo Curto Pra Virar Figurinha.");
        }

        const shape = ["sticker-round", "sticker-circular", "stickerredondo"].includes(command) ? "round" : "square";
        const buffer = await client.downloadMedia(m.raw);

        if (!buffer) return m.reply("Falha Ao Baixar A Mídia. Tente De Novo.");

        try {
            const webp = await toWebp(buffer, type, shape);
            const sticker = addExif(webp, { packname: config.botName, author: config.ownerName });
            await client.sendMessage(m.chat, { sticker }, { quoted: m.raw });
        } catch (e) {
            console.error(`${e.message}`);
        }
    }
}