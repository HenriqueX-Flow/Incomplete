import { logError } from "../../error.js";

/**
 * Obtém O Construtor De Uma Função Async.
 *
 * @returns {Function}
 */
const AsyncFunction = Object.getPrototypeOf(
    async function () {}
).constructor;

/**
 * Converte Qualquer Resultado Do Eval Para Texto.
 *
 * @param {*} value
 * @returns {string}
 */
function formatResult(value) {
    if (value === undefined) {
        return "undefined";
    }

    if (value === null) {
        return "null";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "bigint") {
        return `${value}n`;
    }

    if (typeof value === "function") {
        return value.toString();
    }

    try {
        return JSON.stringify(value, (_, current) => {
            if (typeof current === "bigint") {
                return `${current}n`;
            }
            
            if (current instanceof Error) {
                return {
                    name: current.name,
                    message: current.message,
                    stack: current.stack,
                };
            }
            
            return current;
        }, 2);
    } catch {
        try {
            return String(value);
        } catch {
            return "[Unserializable Value]";
        }
    }
}

/**
 * Extrai Linha E Coluna De Um Stack Trace.
 *
 * @param {string} stack
 * @returns {{ line: string|null, column: string|null }}
 */
function getLocation(stack = "") {
    const patterns = [
        /<anonymous>:(\d+):(\d+)/,
        /eval:(\d+):(\d+)/,
        /\((\d+):(\d+)\)/,
    ];

    for (const pattern of patterns) {
        const match = stack.match(pattern);

        if (match) {
            return {
                line: match[1],
                column: match[2],
            };
        }
    }

    return {
        line: null,
        column: null,
    };
}

/**
 * Remove informações internas excessivas do stack.
 *
 * @param {Error} error
 * @returns {string}
 */
function formatError(error) {
    const name = error?.name || "Error";
    const message = error?.message || String(error);
    const stack = error?.stack || "";

    const { line, column } = getLocation(stack);

    let output = `(❌) ${name}\n` + `━━━━━━━━━━━━━━━━━━\n` + `(💬) ${message}`;

    if (line && column) {
        output += `\nLinha: ${line}\nColuna: ${column}`;
    }

    if (stack) {
        output += `\n\n${stack.split("\n").slice(1, 6).join("\n")}`;
    }

    return output;
}

/**
 * Remove O Prefixo Do Comando Do Código.
 *
 * @param {string} text
 * @returns {string}
 */
function cleanCode(text) {
    return text.replace(/^```(?:js|javascript)?/i, "").replace(/```$/i, "").trim();
}

/**
 * Executa JavaScript Dentro Do Contexto Do Bot.
 *
 * Suporta:
 *
 * !eval 1 + 1
 * !eval return 1 + 1
 * !eval await Promise.resolve("ok")
 * !eval ({ name: "Ooooo" })
 * !eval [1, 2, 3]
 * !eval await m.reply("Olá")
 *
 * @type {import("../../handler.js").PluginRun}
 */
export const run = {
    usage: ["eval", "e"],
    use: "<código>",
    category: "owner",
    owner: true,
    run: async (m, {
        client,
        text,
        Utils,
        config,
        db
    }) => {
        if (!text?.trim()) {
            return m.reply(Utils.example(config.prefix, "eval", "1 + 1"));
        }

        const code = cleanCode(text);

        if (!code) {
            return m.reply(
                Utils.texted("bold", "Nenhum Código Foi Informado."));
        }

        const startedAt = Date.now();

        try {
            /**
             * O Código Recebe Essas Variáveis Diretamente:
             *
             * m
             * client
             * text
             * Utils
             * config
             * db
             */
            const fn = new AsyncFunction(
                "m",
                "client",
                "text",
                "Utils",
                "config",
                "db",
                `"use strict";\n${code}`
            );

            const result = await fn(
                m,
                client,
                text,
                Utils,
                config,
                db
            );

            const elapsed = Date.now() - startedAt;
            const output = formatResult(result);

            const header = `(⚡) ${Utils.texted("bold", "EVAL")}\n` + `━━━━━━━━━━━━━━━━━━\n` + `(⏱️) ${elapsed}ms\n\n`;

            const finalOutput = header + Utils.texted("mono", output);

            if (finalOutput.length > 4000) {
                await m.reply(Utils.texted("bold", `A Saída É Grande Demais (${finalOutput.length} Caracteres). Enviando Como Arquivo...`));

                return client.sendMessage(m.chat, {
                    document: Buffer.from(output, "utf-8"),
                    mimetype: "text/plain",
                    fileName: "eval-result.txt",
                }, { quoted: m.raw });
            }

            return m.reply(finalOutput);

        } catch (error) {
            logError("eval", error);

            const elapsed = Date.now() - startedAt;

            const errorOutput = `(⚡) ${Utils.texted("bold", "EVAL")}\n` + `━━━━━━━━━━━━━━━━━━\n` + `(⏱️) ${elapsed}ms\n\n` + formatError(error);

            return m.reply(errorOutput);
        }
    }
};