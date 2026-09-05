import fs from "fs";
import path from "path";
import { parseFlags } from "#core/flags.js";

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["getplugin", "plugincode", "plugsource"],
    use: "<nome> --file | --code",
    help: [
        "<nome> --file   Manda o .js como documento",
        "<nome> --code   Mostra o código formatado",
        "--help          Esta ajuda"
    ],
    category: "owner",
    owner: true,
    run: async (m, { client, plugins, args, config, Utils }) => {
        const { flags, positional } = parseFlags(args);
        const name = positional[0]?.toLowerCase();

        if (!name) return m.reply(Utils.example(config.prefix, "getplugin", "menu --file"));

        const found = plugins.find((p) => p.usage.includes(name));
        if (!found) return m.reply(Utils.texted("bold", `Plugin \"${name}\" Não Encontrado.`));

        if (!found.file || !fs.existsSync(found.file)) {
            return m.reply(Utils.texted("bold", "Este Plugin Não Tem Arquivo No Disco (Foi Carregado Em Memória)."));
        }

        const source = fs.readFileSync(found.file, "utf-8");
        const fileName = path.basename(found.file);

        if (flags.code) {
            const MAX_CHARS = 6000;
            if (source.length > MAX_CHARS) {
                return m.reply(Utils.texted("bold", `O Código É Grande Demais Pra Enviar Como Bloco (${source.length} Caracteres). O Limite É ${MAX_CHARS}. Use --file.`));
            }

            return client.sendMessage(m.chat, {
                disclaimerText: `Código Fonte De \"${fileName}\" — Enviado Pelo :getplugin.`,
                headerText: `## ${fileName}`,
                contentText: `Comandos: ${found.usage.join(", ")}. Categoria: ${found.category}.`,
                code: source,
                language: "javascript",
                footerText: `${source.split("\n").length} Linhas De Código.`
            }, { quoted: m.raw });
        }

        return client.sendMessage(m.chat, {
            document: Buffer.from(source, "utf-8"),
            mimetype: "text/javascript",
            fileName
        }, { quoted: m.raw });
    }
}
