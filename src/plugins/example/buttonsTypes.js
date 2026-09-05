import { read } from "#utils/path.js";

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["botaolegado", "botoesantigos"],
    category: "example",
    run: async (m, { client, config }) => {
        await client.sendButton(m.chat, {
            image: read("#media/image/thumb.png"),
            name: "Exemplo",
            surname: config.botName,
            text: "Este É Um Exemplo De Botões No Formato Antigo.",
            buttons: [
                {
                    text: "XX",
                    id: `${config.prefix}ping`
                },
                {
                    text: "XX",
                    id: `${config.prefix}menu`
                }
                // Dá Pra Adicionar Um 3º, Mas Recomendado Ficar Em 2
            ],
            quoted: m.raw,
            ai: true
        });
    }
}
