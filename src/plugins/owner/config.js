import { parseFlags } from "#core/flags.js";

const STYLE_VALUES = ["1", "2", "3"];
const STATUS_VALUES = ["public", "private"];
const ON_OFF = ["on", "off"];

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["config", "set", "setup", "cfg"],
    use: "--style 1/2 | --autoread on/off | --autotyping on/off | --status public/private",
    category: "owner",
    owner: true,
    run: async (m, {
        db,
        args,
        config,
        Utils
    }) => {
        const { flags, positional } = parseFlags(args);
        const system = db.data.system;
        const changes = [];
        const styleName = (v) => v === "1" ? "Documento" : "Interativo";

        if (!Object.keys(flags).length && positional[0] && STYLE_VALUES.includes(positional[0])) {
            flags.style = positional[0];
        }

        if ("style" in flags) {
            const value = String(flags.style);
            if (!STYLE_VALUES.includes(value)) {
                changes.push(`Estilo Inválido. Use 1, 2 Ou 3.\n\n${config.prefix}config --style 1`);
            } else {
                system.style = value;
                changes.push(`Estilo Do Menu Alterado Pra ${styleName(value)} (${value}).`);
            }
        }

        if ("autoread" in flags) {
            const value = String(flags.autoread).toLowerCase();
            if (!ON_OFF.includes(value)) {
                changes.push("Valor Inválido Para --autoread. Use \"on\" Ou \"off\".");
            } else {
                system.autoread = value === "on";
                changes.push(`Leitura Automática: ${value === "on" ? "Ativada" : "Desativada"}.`);
            }
        }

        if ("autotyping" in flags) {
            const value = String(flags.autotyping).toLowerCase();
            if (!ON_OFF.includes(value)) {
                changes.push("Valor Inválido Para --autotyping. Use \"on\" Ou \"off\".");
            } else {
                system.autotyping = value === "on";
                changes.push(`Digitando... Automático: ${value === "on" ? "Ativado" : "Desativado"}.`);
            }
        }

        const statusFlag = flags.status ?? flags.stats;
        if (statusFlag !== undefined) {
            const value = String(statusFlag).toLowerCase();
            if (!STATUS_VALUES.includes(value)) {
                changes.push("Valor Inválido Para --status. Use \"public\" Ou \"private\".");
            } else {
                system.status = value;
                const name = value === "public" ? "Público" : "Privado";
                changes.push(`Modo Do Bot Alterado Pra ${name}.`);
            }
        }

        if (!changes.length) {
            return m.reply(Utils.texted("bold", "Configurações Atuais Do Bot:")
                + `\n• Estilo Do Menu: ${system.style} (${styleName(system.style)})`
                + `\n• Leitura Automática: ${system.autoread ? "on" : "off"}`
                + `\n• Digitando... Automático: ${system.autotyping ? "on" : "off"}`
                + `\n• Modo Do Bot: ${system.status}`
                + `\n\nExemplo: ${config.prefix}config --style 2 --autoread on`);
        }

        db.save();
        return m.reply(changes.join("\n"));
    }
}