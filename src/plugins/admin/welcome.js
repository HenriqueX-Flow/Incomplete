import { parseFlags } from "#core/flags.js"
import { DEFAULT_WELCOME_MESSAGE, renderGreeting } from "#whatsapp/greetings.js"

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["welcome", "boasvindas"],
    use: "-on | -off | -reset | -msg Bem-vindo(a) @user ao #grupo!",
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
            const status = chat.welcome.enabled ? "Ativado" : "Desativado"
            const currentMsg = chat.welcome.message || `${DEFAULT_WELCOME_MESSAGE} (Padrão)`
            return m.reply(Utils.texted("bold", "Status Do Aviso De Boas-Vindas:") + `\n${status}`
                + `\n\nMensagem Atual:\n${currentMsg}`
                + `\n\nComandos:\n${config.prefix}welcome -on\n${config.prefix}welcome -off\n${config.prefix}welcome -reset  (Restaura A Mensagem Padrão)\n${config.prefix}welcome -msg Bem-Vindo(a) @user Ao #grupo!`
                + `\n\nPlaceholders Disponíveis: @user (Marca), #user (Nome), #grupo (Nome Do Grupo)`)
        }

        if (action === "on") {
            chat.welcome.enabled = true
            db.save()
            return m.reply(Utils.texted("bold", "Aviso De Boas-Vindas Ativado Com Sucesso."))
        }

        if (action === "off") {
            chat.welcome.enabled = false
            db.save()
            return m.reply(Utils.texted("bold", "Aviso De Boas-Vindas Desativado Com Sucesso."))
        }

        if (action === "reset") {
            chat.welcome.message = null
            db.save()
            return m.reply(Utils.texted("bold", "Mensagem De Boas-Vindas Restaurada Para O Padrão:") + `\n${DEFAULT_WELCOME_MESSAGE}`)
        }

        if (action === "msg") {
            const novaMensagem = positional.join(" ")
            if (!novaMensagem) {
                return m.reply(Utils.example(config.prefix, "welcome", "-msg Bem-Vindo(a) @user Ao #grupo!"))
            }

            chat.welcome.message = novaMensagem
            db.save()

            const preview = renderGreeting(novaMensagem, {
                userJid: m.sender,
                userName: m.pushName || "Alguém",
                groupName: "Esse Grupo"
            })
            return m.reply(Utils.texted("bold", "Mensagem De Boas-Vindas Atualizada Com Sucesso.")
                + `\n\nPrévia Da Mensagem:\n${preview}`
                + (chat.welcome.enabled ? "" : `\n⚠️ O Aviso De Boas-Vindas Ainda Está Desativado. Use ${config.prefix}welcome -on Pra Ligar.`))
        }

        return m.reply(Utils.example(config.prefix, "welcome", "-on"))
    }
}