import { parseFlags } from "#core/flags.js"
import { DEFAULT_LEAVE_MESSAGE, renderGreeting } from "#whatsapp/greetings.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["leave", "saida", "saída"],
    use: "-on | -off | -reset | -msg #user Saiu Do #grupo. 👋",
    category: "admin",
    group: true,
    admin: true,
    run: async (m, {
        db,
        args,
        config,
        Utils
    }) => {
        const chat = db.getChat(m.chat)
        const {
            action,
            positional
        } = parseFlags(args)

        if (!action) {
            const status = chat.leave.enabled ? "Ativado" : "Desativado"
            const currentMsg = chat.leave.message || `${DEFAULT_LEAVE_MESSAGE} (Padrão)`
            return m.reply(Utils.texted("bold", "Status Do Aviso De Saída:") + `\n${status}`
                + `\n\nMensagem Atual:\n${currentMsg}`
                + `\n\nComandos:\n${config.prefix}leave -on\n${config.prefix}leave -off\n${config.prefix}leave -reset  (Restaura A Mensagem Padrão)\n${config.prefix}leave -msg #user Saiu Do Grupo. 👋`
                + `\n\nPlaceholders Disponíveis: @user (Marca), #user (Nome), #grupo (Nome Do Grupo)`
                + `\nObservação: O @user Só Marca Se A Pessoa Estiver No Grupo.`)
        }

        if (action === "on") {
            chat.leave.enabled = true
            db.save()
            return m.reply(Utils.texted("bold", "Aviso De Saída Ativado Com Sucesso."))
        }

        if (action === "off") {
            chat.leave.enabled = false
            db.save()
            return m.reply(Utils.texted("bold", "Aviso De Saída Desativado Com Sucesso."))
        }

        if (action === "reset") {
            chat.leave.message = null
            db.save()
            return m.reply(Utils.texted("bold", "Mensagem De Saída Restaurada Para O Padrão:") + `\n${DEFAULT_LEAVE_MESSAGE}`)
        }

        if (action === "msg") {
            const novaMensagem = positional.join(" ")
            if (!novaMensagem) {
                return m.reply(Utils.example(config.prefix, "leave", "-msg #user Saiu Do Grupo. 👋"))
            }

            chat.leave.message = novaMensagem
            db.save()

            const preview = renderGreeting(novaMensagem, {
                userJid: m.sender,
                userName: m.pushName || "Alguém",
                groupName: "Esse Grupo"
            })
            return m.reply(Utils.texted("bold", "Mensagem De Saída Atualizada Com Sucesso.")
                + `\n\nPrévia Da Mensagem:\n${preview}`
                + (chat.leave.enabled ? "" : `\n⚠️ O Aviso De Saída Ainda Está Desativado. Use ${config.prefix}leave -on Pra Ligar.`))
        }

        return m.reply(Utils.example(config.prefix, "leave", "-on"))
    }
}