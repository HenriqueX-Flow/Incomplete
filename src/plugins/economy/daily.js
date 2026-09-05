import { runtime } from "#core/utils.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["daily", "resgatar"],
    category: "economy",
    run: async (m, {
        client,
        db,
        config,
        Utils
    }) => {
        const user = db.getUser(m.sender)
        const eco = config.economy || {}
        const symbol = eco.currencySymbol || "NC"
        const cooldown = (eco.dailyCooldownHours ?? 24) * 60 * 60 * 1000
        const now = Date.now()

        const elapsed = now - (user.lastDaily || 0)
        if (elapsed < cooldown) {
            return m.reply(Utils.texted("bold", `Você Já Resgatou Seu Bônus Hoje. Volte Em ${runtime(cooldown - elapsed)}.`))
        }

        const min = eco.dailyMin ?? 20
        const max = eco.dailyMax ?? 60
        const amount = Math.floor(Math.random() * (max - min + 1)) + min

        user.nc = (user.nc || 0) + amount
        user.lastDaily = now
        db.save()

        return m.reply(Utils.texted("bold", `Você Resgatou ${amount} ${symbol}. Seu Saldo Agora É ${user.nc} ${symbol}.`))
    }
}