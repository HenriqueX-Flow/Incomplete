import {
    parseFlags,
    parseDuration,
    formatDuration
} from "#core/flags.js"
import {
    grantPremium,
    revokePremium
} from "#core/premium.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["premium", "vip"],
    use: "-add --user @alguém --t 5m  (ou sem --t pra ser permanente)  |  -delete --user @alguém",
    category: "owner",
    run: async (m, {
        client,
        db,
        args,
        config,
        Utils
    }) => {
        const {
            action,
            flags
        } = parseFlags(args);

        if (!action) {
            return m.reply(Utils.texted("bold", `Uso Do Comando:\n${config.prefix}premium -add --user @alguém --t 5m\n${config.prefix}premium -add --user @alguém  (Sem --t Pra Ser Para Sempre)\n${config.prefix}premium -delete --user @alguém`));
        }

        const rawTarget = flags.user || m.mentionedJid?.[0] || m.quoted?.sender;
        if (!rawTarget || rawTarget === true) {
            return m.reply(Utils.texted("bold", "Você Precisa Mencionar Ou Informar O Número De Alguém Com --user."));
        }

        let jid = String(rawTarget).includes("@") ? String(rawTarget) : null;
        if (!jid) {
            const [result] = await client.onWhatsApp(String(rawTarget).replace(/\D/g, ""))
            if (!result?.exists) return m.reply(Utils.texted("bold", "Número Inválido."))
            jid = client.decodeJid(result.jid)
        }

        const user = db.getUser(jid);
        const number = jid.split("@")[0];

        if (["add", "set"].includes(action)) {
            let durationMs = null;
            if (flags.t) {
                durationMs = parseDuration(flags.t);
                if (!durationMs) return m.reply(Utils.texted("bold", "Tempo Inválido. Use Algo Como --t 5m, --t 1h Ou --t 7d."));
            }

            grantPremium(user, durationMs)
            user.limit = config.premiumLimit ?? user.limit
            db.save()

            const validade = durationMs ? `Por ${formatDuration(durationMs)}` : "Para Sempre"
            return m.reply(Utils.texted("bold", `O Número @${number} Agora É Premium ${validade}.`))
        }

        if (["delete", "del", "remove"].includes(action)) {
            revokePremium(user)
            db.save()
            return m.reply(Utils.texted("bold", `O Premium Do Número @${number} Foi Removido.`))
        }

        return m.reply(Utils.texted("bold", `Ação Desconhecida: ${action}`))
    },
    owner: true
}