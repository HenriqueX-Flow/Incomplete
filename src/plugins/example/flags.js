import { parseFlags } from "#core/flags.js"

/**
 * Exemplo De Como Criar Um Comando Estilo Terminal Com Flags + Ajuda.
 *
 * 1) A AÇÃO usa UM traço: `-add`, `-delete` (escolhe o "modo").
 * 2) As FLAGS usam DOIS traços: `--user @alguém`, `--t 5m`.
 * 3) O que "sobra" sem traço vira `positional` (use SEMPRE isso,
 *    nunca `args[0]` direto — ver src/core/flags.js).
 * 4) `help: [...]` é OPCIONAL: lista cada flag. Se você preencher,
 *    o usuário vê tudo com `${prefix}comando --help`.
 */

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["exemploflags"],
    use: "-add --user @alguém --t 5m  |  -delete --user @alguém",
    category: "example",
    run: async (m, { args, Utils }) => {
        const { action, flags, positional } = parseFlags(args)

        if (!action) {
            return m.reply(Utils.example(":", "exemploflags", "-add --user @alguém --t 5m"))
        }

        const alvo = flags.user || positional[0] || null

        if (action === "add") return m.reply(`Premium Adicionado Pra ${alvo}${flags.t ? ` Por ${flags.t}` : " Para Sempre"}.`)
        if (action === "delete") return m.reply(`Premium Removido De ${alvo}.`)

        return m.reply(`Ação Desconhecida: ${action}`)
    }
}