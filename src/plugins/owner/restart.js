/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["restart"],
    category: "owner",
    run: async (m) => {
        await m.reply("Reiniciando O Bot, Aguarde Um Instante...");
        // Se Tiver Rodando Com pm2 (Recomendado No Termux), Ele Reinicia Sozinho.
        // Se Tiver Rodando Só Com "node index.js", O Processo Só Encerra.
        process.exit(0);
    },
    owner: true
}