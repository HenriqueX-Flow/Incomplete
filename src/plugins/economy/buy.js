import { grantPremium } from "#core/premium.js"
import { formatDuration } from "#core/flags.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["comprar", "buy"],
    use: "(limite | premium <pacote>) — Veja Os Pacotes Em !loja",
    category: "economy",
    run: async (m, {
        db,
        config,
        args,
        Utils
    }) => {
        const eco = config.economy || {}
        const symbol = eco.currencySymbol || "NC"
        const user = db.getUser(m.sender)
        const item = args[0]?.toLowerCase()

        if (item === "limite") {
            const pkg = eco.limitPackage
            if (!pkg) return m.reply(Utils.texted("bold", "Este Item Não Está Disponivel No Momento."))
            if ((user.nc || 0) < pkg.price) {
                return m.reply(Utils.texted("bold", `Saldo Insuficiente. Você Precisa De ${pkg.price} ${symbol}, E Tem Apenas ${user.nc || 0} ${symbol}.`))
            }
            user.nc -= pkg.price
            user.limit += pkg.amount
            db.save()
            return m.reply(Utils.texted("bold", `Você Comprou +${pkg.amount} De Limite. Seu Saldo Agora É ${user.nc} ${symbol}.`))
        }

        if (item === "premium") {
            const packages = eco.premiumPackages || {}
            const pkgName = args[1]?.toLowerCase()
            const pkg = packages[pkgName]
            if (!pkg) {
                return m.reply(Utils.texted("bold", `Pacote Inválido. Opções Disponíveis: ${Object.keys(packages).join(", ") || "Nenhum Pacote Premium Configurado."}`))
            }
            if ((user.nc || 0) < pkg.price) {
                return m.reply(Utils.texted("bold", `Saldo Insuficiente. Você Precisa De ${pkg.price} ${symbol}, E Tem Apenas ${user.nc || 0} ${symbol}.`))
            }
            user.nc -= pkg.price
            grantPremium(user, pkg.ms || null)
            user.limit = config.premiumLimit ?? user.limit
            db.save()
            const validade = pkg.ms ? `Por ${formatDuration(pkg.ms)}` : "Para Sempre"
            return m.reply(Utils.texted("bold", `Você Virou Premium ${validade}. Seu Saldo Agora É ${user.nc} ${symbol}.`))
        }

        return m.reply(Utils.example(config.prefix, "comprar", "limite  |  premium 1h"))
    }
}