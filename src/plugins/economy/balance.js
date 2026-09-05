/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["saldo", "nc", "carteira"],
    category: "economy",
    run: async (m, { client, db, config }) => {
        const user = db.getUser(m.sender)
        const name = await client.getName(m.sender)
        const symbol = config.economy?.currencySymbol || "NC"
        await client.reply(m.chat, `Saldo Do Usuário *${name}*: *${user.nc || 0}* ${symbol}.`)
    }
}