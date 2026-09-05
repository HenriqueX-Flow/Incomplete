/**
 * Exemplo De Como Travar Qualquer Plugin Por Nível Mínimo: Basta
 * Adicionar `needLevel: <número>` No run, Igual Já Existe `premium`,
 * `owner`, `group`, Etc. O Handler Confere O Nível Atual Do Usuário
 * (Calculado A Partir Do XP Dele, O Mesmo Sistema Do Rank Card) Antes
 * De Deixar O Comando Rodar. O Dono Do Bot Sempre Passa Direto.
 */

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["arearestrita"],
    category: "example",
    needLevel: 5,
    run: async (m, { client }) => {
        await client.reply(m.chat, "Você Acessou A Área Restrita. Este Comando Só Funciona Pra Quem Tem Nível 5 Ou Mais.")
    }
}