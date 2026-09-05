import { parseFlags } from "#core/flags.js"
import { LINK_TYPES } from "#whatsapp/antilink.js"

const MODES = ["delete", "remove", "protect"]

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["antilink"],
    use: "-<tipo> --<delete|remove|protect> <on|off>  (ex: -chat --delete on)",
    category: "admin",
    group: true,
    admin: true,
    run: async (m, {
        client,
        db,
        args,
        config,
        Utils
    }) => {
        const group = db.getGroup(m.chat)
        const {
            action: type,
            flags
        } = parseFlags(args)
        const types = Object.keys(LINK_TYPES)
        const linkLabel = (key) => LINK_TYPES[key].label

        if (!type) {
            const lines = types.map((key) => {
                const cfg = group.antilink[key]
                return cfg
                    ? `✅ ${linkLabel(key)}: On (Modo: ${cfg.mode})`
                    : `❌ ${linkLabel(key)}: Off`
            })
            return m.reply(Utils.texted("bold", "Configuração Do Antilink No Grupo:") + "\n" + lines.join("\n") + `\n\nExemplo: ${config.prefix}antilink -chat --delete on`)
        }

        if (!LINK_TYPES[type]) {
            return m.reply(Utils.texted("bold", `Tipo De Link Não Existe: ${type}. Tipos Disponíveis: ${types.map((x) => "-" + x).join(", ")}`))
        }

        const modeFlag = MODES.find((mode) => mode in flags)

        if (!modeFlag) {
            const cfg = group.antilink[type]
            return m.reply(`*${linkLabel(type)}*: ${cfg ? `On (Modo: ${cfg.mode})` : "Off"}\n` + `Uso: ${config.prefix}antilink -${type} --delete on`)
        }

        const value = String(flags[modeFlag]).toLowerCase()
        if (!["on", "off"].includes(value)) {
            return m.reply(Utils.texted("bold", `Use "on" Ou "off" Depois De --${modeFlag}.`))
        }

        if (value === "off") {
            delete group.antilink[type]
            db.save()
            return m.reply(Utils.texted("bold", `Antilink De ${linkLabel(type)} Desativado.`))
        }

        group.antilink[type] = {
            mode: modeFlag
        }
        db.save()

        const botIsAdmin = await client.getAdmin(m.chat, client.decodeJid(client.user.id))
        const warning = botIsAdmin ? "" : "\n⚠️ Aviso: Pro Modo \"Remove\" Ou \"Protect\" Funcionar Direito, Eu Preciso Ser Admin Do Grupo."

        return m.reply(Utils.texted("bold", `Antilink De ${linkLabel(type)} Ativado (Modo: ${modeFlag}).`) + warning)
    }
}