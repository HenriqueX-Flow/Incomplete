/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["add", "promote", "demote", "kick"],
    use: "Mencione Ou Marca A Mensagem De Alguém",
    category: "admin",
    run: async (m, { client, text, command, Utils }) => {
        try {
            const arg = (m.mentionedJid?.[0] || m.quoted?.sender || text)?.trim();
            if (!arg) return m.reply(Utils.texted("bold", "Você Precisa Mencionar, Responder A Mensagem De Alguém Ou Digitar O Número."));

            let jid = arg.includes("@") ? arg : null;
            if (!jid) {
                const [result] = await client.onWhatsApp(arg);
                if (!result?.exists) throw new Error("Número Inválido.");
                jid = client.decodeJid(result.jid);
            }

            const member = await client.getJidFromParticipants(m.chat, jid);
            const number = jid.split("@")[0];

            if (["kick", "promote", "demote"].includes(command)) {
                if (!member) return m.reply(Utils.texted("bold", "Essa Pessoa Não Está No Grupo."));
                await client.groupParticipantsUpdate(m.chat, [jid], command === "kick" ? "remove" : command);
                const message = command === "kick" ? `Usuário @${number} Removido Do Grupo.`
                    : command === "promote" ? `Usuário @${number} Promovido A Administrador.`
                    : `Usuário @${number} Rebaixado De Administrador.`;
                return m.reply(Utils.texted("bold", message));
            }

            if (command === "add") {
                if (member) return m.reply(Utils.texted("bold", `O Número @${number} Já Está No Grupo.`));
                await client.groupParticipantsUpdate(m.chat, [jid], "add");
                return m.reply(Utils.texted("bold", `O Número @${number} Foi Adicionado Ao Grupo Com Sucesso.`));
            }
        } catch (e) {
            console.error(`${e.message}`);
        }
    },
    group: true,
    admin: true,
    botAdmin: true
}