/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["baixar"],
    use: "(Marca Uma Mídia)",
    category: "example",
    run: async (m, { client }) => {
        const type = client.hasMedia(m.raw);
        
        if (!type) return m.reply("Marca Uma Mídia (Imagem, Vídeo, Áudio, Figurinha Ou Documento) Primeiro.");

        const buffer = await client.downloadMedia(m.raw);
        if (!buffer) return m.reply("Falha Ao Baixar A Mídia. Tente De Novo.");

        await client.reply(m.chat, `Mídia Baixada Com Sucesso. Tipo: ${type}. Tamanho: ${(buffer.length / 1024).toFixed(1)} KB.`)
    }
}