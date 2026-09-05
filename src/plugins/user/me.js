import { isPremium } from "#core/premium.js";
import { getLevelProgress } from "#utils/levelSystem.js";

/** @type {import('../../handler.js').PluginRun} */
export const run = {
    usage: ['me', 'perfil'],
    category: 'user',
    run: async (m, {
        client,
        db,
        config
    }) => {
        const user = db.getUser(m.sender)
        const name = await client.getName(m.sender)
        const premium = isPremium(user)
        const {
            level
        } = getLevelProgress(user.xp || 0)

        const symbol = config.economy?.currencySymbol || 'NC'
        const validity = premium && user.premiumUntil ? ` (Até ${new Date(user.premiumUntil).toLocaleString('pt-BR')})` : premium ? ` (Permanente)` : ''

        await client.reply(
            m.chat,
            `👤 *${name}*\n` +
            `Limite: ${user.limit}\n` +
            `Nível: ${level}\n` +
            `Saldo: ${user.nc || 0} ${symbol}\n` +
            `Premium: ${premium ? 'Sim' + validity : 'Não'}\n` +
            `Banido: ${user.banned ? 'Sim' : 'Não'}`
        )
    }
}