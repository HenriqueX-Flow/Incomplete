import { parseFlags, resolveTarget } from "#core/flags.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["give", "addnc", "givenc", "addlimit", "givelimit", "limite"],
    use: "-nc/-limit --user @alguém --amount 100",
    category: "owner",
    owner: true,
    run: async (m, {
        client,
        db,
        args,
        config,
        command,
        Utils
    }) => {
        const { action, flags } = parseFlags(args)

        const legacyAction = ["addnc", "givenc"].includes(command) ? "nc" : ["addlimit", "givelimit", "limite"].includes(command) ? "limit" : null
        const resource = action || legacyAction

        if (!resource || !["nc", "limit"].includes(resource)) {
            return m.reply(Utils.texted("bold", `Uso Do Comando:\n${config.prefix}give -nc --user @alguém --amount 100\n${config.prefix}give -limit --user @alguém --amount 10\n(Também Aceita Mencionar/Responder Em Vez De --user, E O Número No Final Em Vez De --amount)`))
        }

        const amount = parseInt(flags.amount ?? args[args.length - 1])
        if (isNaN(amount)) {
            return m.reply(Utils.example(config.prefix, "give", `-${resource} --user @alguém --amount 100`))
        }

        const rawTarget = flags.user !== undefined ? flags.user : (args.length > 1 ? args[0] : null)
        const jid = await resolveTarget(client, m, rawTarget)
        if (!jid) return m.reply(Utils.texted("bold", "Você Precisa Mencionar Ou Responder A Mensagem De Alguém."))

        const user = db.getUser(jid)
        const number = jid.split("@")[0]

        if (resource === "nc") {
            user.nc = Math.max(0, (user.nc || 0) + amount)
            db.save()
            const symbol = config.economy?.currencySymbol || "NC"
            return m.reply(Utils.texted("bold", `Você Adicionou ${amount} ${symbol} Pro Número @${number}. Novo Saldo: ${user.nc} ${symbol}.`))
        }

        user.limit = Math.max(0, (user.limit || 0) + amount)
        db.save()
        return m.reply(Utils.texted("bold", `Você Adicionou ${amount} De Limite Pro Número @${number}. Novo Limite: ${user.limit}.`))
    }
}