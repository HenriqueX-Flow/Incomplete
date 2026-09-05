import { logError } from "../../error.js";

// Se O JSON For Maior Que Isso, Envia Como Arquivo Automaticamente
const MAX_TEXT_CHARS = 4000;

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["raw"],
    use: "(responda a uma mensagem) | --file",
    help: [
        "(responder)   Mostra O JSON Da Mensagem Respondida",
        "--file        Envia O JSON Completo Como Arquivo .json",
    ],
    category: "owner",
    owner: true,
    run: async (m, { client, args, Utils }) => {
        const wantsFile = args.includes("--file")

        // Se Responder A Uma Mensagem, Mostra O JSON Dela; Senão, O Da Própria
        const quoted = m.quoted?.raw
        const raw = quoted?.message ? quoted : m.raw

        if (!raw || !raw.message) {
            return m.reply(Utils.texted("bold", "Não Foi Possível Obter O JSON Desta Mensagem."))
        }

        const json = JSON.stringify(raw, null, 2)

        if (wantsFile || json.length > MAX_TEXT_CHARS) {
            return client.sendMessage(m.chat, {
                document: Buffer.from(json, "utf-8"),
                mimetype: "application/json",
                fileName: `raw-${Date.now()}.json`
            }, { quoted: m.raw })
        }

        return m.reply(Utils.texted("mono", json))
    }
}
