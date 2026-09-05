/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["ban", "unban", "desban"],
    use: "(Mencione, Marca Ou Informe O Número)",
    category: "owner",
    run: async (m, {
        client,
        db,
        args,
        command,
        Utils
    }) => {
        const arg = (m.mentionedJid?.[0] || m.quoted?.sender || args[0])?.trim();
        if (!arg) return m.reply(Utils.texted("bold", "Você Precisa Mencionar, Responder A Mensagem De Alguém Ou Informar O Número."));

        let jid = arg.includes("@") ? arg : null;
        if (!jid) {
            const [result] = await client.onWhatsApp(arg.replace(/\D/g, ""));
            if (!result?.exists) return m.reply(Utils.texted("bold", "Número Inválido."));
            jid = client.decodeJid(result.jid);
        }

        const user = db.getUser(jid);
        const number = jid.split("@")[0];

        if (command === "ban") {
            user.banned = true;
            db.save();
            return m.reply(Utils.texted("bold", `O Número @${number} Foi Banido Do Bot.`));
        }

        user.banned = false;
        user.floodStrikes = 0;
        db.save();
        return m.reply(Utils.texted("bold", `O Número @${number} Foi Desbanido.`));
    },
    owner: true
}