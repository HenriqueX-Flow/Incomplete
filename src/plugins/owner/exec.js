import { exec } from "child_process";
import { logError } from "../../error.js";

// Comandos Perigosos Que Podem Quebrar O Sistema Ou O Próprio Bot
const DANGEROUS_COMMANDS = [
    "rm", "rmdir", "unlink", "dd", "mkfs", "format", "shutdown", "reboot",
    "halt", "poweroff", "kill", "pkill", "killall", "sudo", "su", "chmod",
    "chown", "mv /", "> /dev/sda", ">:",
    "npm", "node", "pnpm", "yarn", "bun", "npx",
    "git reset --hard", "git clean", "git push --force"
];

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["exec", "term", "terminal"],
    use: "<comando>",
    help: [
        "<comando>   Executa Um Comando No Terminal Do Bot",
    ],
    category: "owner",
    owner: true,
    run: async (m, { client, text, Utils, config }) => {
        if (!text) {
            return m.reply(Utils.example(config.prefix, "exec", "ls -la"))
        }

        const firstWord = text.trim().split(/\s+/)[0].toLowerCase()
        const isDangerous = DANGEROUS_COMMANDS.some((cmd) => {
            const normalized = cmd.toLowerCase()
            return firstWord === normalized || text.toLowerCase().includes(normalized)
        })

        if (isDangerous) {
            return m.reply(Utils.texted("bold", "Comando Bloqueado. Esse Comando É Perigoso E Pode Quebrar O Bot Ou O Sistema."))
        }

        await m.reply(Utils.texted("bold", `Executando:`) + `\n${Utils.texted("mono", text)}`)

        exec(text, { timeout: 15000, maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
            try {
                const output = stdout || stderr || (error ? `Erro: ${error.message}` : "Sem Saída")
                if (output.length > 4000) {
                    await m.reply(Utils.texted("bold", `A Saída É Grande Demais (${output.length} Caracteres). Enviando Como Arquivo...`))
                    return client.sendMessage(m.chat, {
                        document: Buffer.from(output, "utf-8"),
                        mimetype: "text/plain",
                        fileName: "saida.txt"
                    }, { quoted: m.raw })
                }
                return m.reply(Utils.texted("mono", output) + (error ? `\n\n${Utils.texted("bold", "Comando Terminou Com Erro.")}` : ""))
            } catch (e) {
                logError("exec:output", e)
                return m.reply(Utils.jsonFormat(e))
            }
        })
    }
}
