import { parseFlags } from "#core/flags.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["grupo", "group"],
    use: "-name <novo nome> | -desc <nova descrição> | -set open|close",
    category: "admin",
    run: async (m, { client, args, Utils, config }) => {
        const { action, positional } = parseFlags(args)

        if (!action) {
            return m.reply(Utils.texted("bold", `Uso Do Comando:\n${config.prefix}grupo -name Novo Nome\n${config.prefix}grupo -desc Nova Descrição\n${config.prefix}grupo -set open (ou close)`));
        }

        const value = positional.join(" ").trim()

        try {
            if (action === "name") {
                if (!value) return m.reply(Utils.texted("italic", "Você Precisa Digitar O Novo Nome."));
                if (value.length > 25) return m.reply(Utils.texted("italic", "O Nome Do Grupo Tem Limite De 25 Caracteres."));
                await client.groupUpdateSubject(m.chat, value);
                return m.reply(Utils.texted("bold", `Nome Do Grupo Alterado Com Sucesso Para: ${value}`));
            }

            if (action === "desc") {
                if (!value) return m.reply(Utils.texted("italic", "Você Precisa Digitar A Nova Descrição."));
                await client.groupUpdateDescription(m.chat, value);
                return m.reply(Utils.texted("bold", "Descrição Do Grupo Alterada Com Sucesso."));
            }

            if (action === "set") {
                const sub = value.toLowerCase();
                if (sub === "close") {
                    await client.groupSettingUpdate(m.chat, 'announcement');
                    return m.reply(Utils.texted("bold", "Grupo Fechado Com Sucesso. Só Administradores Podem Mandar Mensagem."));
                } else if (sub === "open") {
                    await client.groupSettingUpdate(m.chat, 'not_announcement');
                    return m.reply(Utils.texted("bold", "Grupo Aberto Com Sucesso. Todos Podem Mandar Mensagem."));
                }
                return m.reply(Utils.texted("bold", "Valor Inválido. Use -set open Ou -set close."));
            }

            return m.reply(Utils.texted("bold", `Ação Desconhecida: ${action}`));
        } catch (e) {
            console.error(`${e.message}`);
            m.reply(Utils.texted("bold", "Erro Ao Executar A Ação No Grupo."));
        }
    },
    group: true,
    admin: true,
    botAdmin: true
}