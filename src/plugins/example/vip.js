/**
 * Exemplo De Como Travar Qualquer Plugin Pra Ser Exclusivo De
 * Premium/Vip: Basta Adicionar `premium: true` No run, Igual
 * Já Existe `owner`, `admin`, `group`, Etc.
 */

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["vipzone"],
    category: "example",
    premium: true,
    run: async (m, { client }) => {
        await client.reply(m.chat, "Você Está Na Zona Premium (Vip). Aproveite Os Benefícios Exclusivos.")
    }
}