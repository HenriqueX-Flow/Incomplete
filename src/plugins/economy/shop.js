/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["loja", "shop"],
    category: "economy",
    run: async (m, { client, config }) => {
        const eco = config.economy || {}
        const symbol = eco.currencySymbol || "NC"
        const {
            limitPackage,
            premiumPackages = {}
        } = eco

        let text = `╭──❍「 *🛒 Loja* 」❍
├ Moeda: ${eco.currencyName || "Nemesis Credits"}\n`

        if (limitPackage) {
            text += `├ 📦 Pacote De Limite: +${limitPackage.amount} Usos Por ${limitPackage.price} ${symbol}
├ Use: ${config.prefix}comprar limite\n`
        }

        text += `├ ⭐ Pacotes Premium:\n`
        for (const [key, pkg] of Object.entries(premiumPackages)) {
            text += `├ • ${key}: ${pkg.price} ${symbol}
├ Use: ${config.prefix}comprar premium ${key}\n`
        }

        text += `╰──────❍
💰 Resgate ${symbol} Grátis Todo Dia Com ${config.prefix}daily!`

        await client.reply(m.chat, text)
    }
}