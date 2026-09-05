import chalk from "chalk";
import Jimp from "jimp";

// Força O chalk A Usar Cores Mesmo Sem TTY (ex: shelljs/spawn Com Pipe)
if (process.env.FORCE_COLOR === undefined && process.env.NO_COLOR === undefined) {
    process.env.FORCE_COLOR = "1";
    chalk.level = 1;
}

/**
 * Aplica Um Estilo De Texto Simples.
 * @param {"bold"|"italic"|"mono"} style
 * @param {string} text
 * @returns {string}
 */
export function texted(style, text) {
    switch (style) {
        case "bold":
            return `*${text}*`
        case "italic":
            return `_${text}_`
        case "mono":
            return "```" + text + "```"
        default:
            return text
    }
}

/**
 * Monta Uma Mensagem De Exemplo De Uso De Comando.
 */
export function example(prefix, command, example) {
    return `Exemplo De Uso:\n${prefix}${command} ${example}`;
}

/**
 * Cria Uma Miniatura Quadrada Em JPEG, Do Tamanho Que O WhatsApp Costuma
 * Aceitar Sem Erro Pro `jpegThumbnail` De Documento (300 Ou 400px).
 * Usa `.cover()` Em Vez De `.resize()` Pra CORTAR Em Vez De ESTICAR —
 * Senão Um Banner Retangular (Tipo O RankCard, 900x300) Fica Achatado
 * E Ilegível Dentro Do Quadrado.
 * @param {Buffer|string} input - Caminho, URL Ou Buffer Da Imagem
 * @param {number} size - Lado Do Quadrado Em Pixels (300 Ou 400 São Os Mais Usados)
 * @returns {Promise<Buffer|null>}
 */
export async function reSize(input, size = 300) {
    try {
        const image = await Jimp.read(input);
        return await image.cover(size, size).quality(80).getBufferAsync(Jimp.MIME_JPEG);
    } catch (erro) {
        console.error("Erro Ao Gerar A Miniatura:", erro);
        return null;
    }
}


/**
 * Formata Um Erro Para Exibir De Forma Legível No WhatsApp.
 */
export function jsonFormat(e) {
    return "```" + (e?.stack || e?.message || String(e)) + "```";
}

/**
 * Pega Hora/Data Formatada No Fuso De Fortaleza.
 */
export function nowBR() {
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Fortaleza"
    });
}

/**
 * Converte Milissegundos De Uptime Em Texto.
 */
export function runtime(ms) {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return `${h}h ${m}m ${s}s`;
}

/**
 * Baixa Um Buffer De Uma URL Com Um Limite De Tempo, O Fetch Puro Do
 * Node Não Tem Timeout Por Padrão, Então Uma URL Lenta Ou Travada
 * (ex: CDN De Foto De Perfil Do WhatsApp) Pode Prender O Comando
 * Pra Sempre Sem Isso.
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<Buffer|null>} null Se Der Timeout Ou Qualquer Erro
 */
export async function fetchBufferWithTimeout(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal
        })
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer());
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Espera Um Tempo Em Milissegundos. Usado Em Qualquer Lugar Que Precise
 * Simular Um Delay (Ex: src/whatsapp/greetings.js Simulando Comportamento
 * Humano No Welcome/Leave).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Número Inteiro Aleatório Entre min E max (Os Dois Incluídos).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sistema De Logs Coloridos Para O Terminal
 */
const log = {
    success: (tag, msg) => {
        const badge = chalk.bgGreen.black(' Incomplete | Success ');
        const tagFormatted = chalk.gray(`(${tag})`);
        console.log(`◈ ${badge} ${tagFormatted} ${msg}`);
    },
    warn: (tag, msg) => {
        const badge = chalk.bgYellow.black(' Incomplete | Warn ');
        const tagFormatted = chalk.gray(`(${tag})`);
        console.log(`◈ ${badge} ${tagFormatted} ${msg}`);
    },
    error: (tag, msg) => {
        const badge = chalk.bgRed.black(' Incomplete | Error ');
        const tagFormatted = chalk.gray(`(${tag})`);
        console.log(`◈ ${badge} ${tagFormatted} ${msg}`);
    },
    info: (tag, msg) => {
        const badge = chalk.bgCyan.black(' Incomplete | Info ');
        const tagFormatted = chalk.gray(`(${tag})`);
        console.log(`◈ ${badge} ${tagFormatted} ${msg}`);
    }
};

/**
 * Oculta O final Do Número (Ex: 558888******)
 * @param {string} jid 
 * @returns {string}
 */
export function maskNumber(jid) {
    if (!jid) return "Desconhecido";
    const number = jid.split('@')[0];
    if (number.length <= 6) return number;
    return number.slice(0, 6) + '*'.repeat(number.length - 6);
}

/**
 * Remove Sequências De Escape ANSI De Uma String.
 *
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
    return String(value).replace(
        // eslint-disable-next-line no-control-regex
        /\u001B(?:[@-_][0-?]*[ -/]*[@-~])/g,
        ""
    );
}

/**
 * Calcula O Comprimento Visível De Uma String Terminal.
 *
 * @param {string} value
 * @returns {number}
 */
function visibleLength(value) {
    return stripAnsi(value).length;
}

/**
 * Preenche Um Valor Terminal Sem Contar As Sequências De Cores ANSI.
 *
 * @param {string} value
 * @param {number} width
 * @returns {string}
 */
function padRight(value, width) {
    const text = String(value);
    return text + " ".repeat(Math.max(0, width - visibleLength(text)));
}

/**
 * Detecta O Tipo De Mensagem Do Baileys.
 *
 * @param {Object} message
 * @param {string} text
 * @returns {{ icon: string, type: string, color: import("chalk").Chalk }}
 */
function detectMessageKind(message, text) {
    const keys = Object.keys(message || {});
    const firstKey = keys[0] === "messageContextInfo" ? keys[1] : keys[0];

    switch (firstKey) {
        case "imageMessage":
            return {
                icon: "🖼️",
                    type: "IMAGE",
                    color: chalk.magenta
            };
        case "videoMessage":
            return {
                icon: "🎬",
                    type: "VÍDEO",
                    color: chalk.magenta
            };
        case "audioMessage":
            return {
                icon: "🎵",
                    type: "AUDIO",
                    color: chalk.cyan
            };
        case "stickerMessage":
            return {
                icon: "🧩",
                    type: "FIGURINHA",
                    color: chalk.yellow
            };
        case "documentMessage":
            return {
                icon: "📄",
                    type: "DOCUMENTO",
                    color: chalk.blue
            };
        case "locationMessage":
            return {
                icon: "📍",
                    type: "LOCALIZAÇÃO",
                    color: chalk.blue
            };
        case "contactMessage":
            return {
                icon: "👤",
                    type: "CONTATO",
                    color: chalk.blue
            };
        case "pollCreationMessage":
            return {
                icon: "📊",
                    type: "ENQUETE",
                    color: chalk.cyan
            };
        case "reactionMessage":
            return {
                icon: "💞",
                    type: "REAÇÃO",
                    color: chalk.gray
            };
        case "buttonsResponseMessage":
            return {
                icon: "🔘",
                    type: "BOTÃO",
                    color: chalk.green
            };
        case "templateButtonReplyMessage":
            return {
                icon: "🔘",
                    type: "BOTÃO",
                    color: chalk.green
            };
        case "listResponseMessage":
            return {
                icon: "📋",
                    type: "LISTA",
                    color: chalk.green
            };
        case "interactiveResponseMessage":
            return {
                icon: "🎛️",
                    type: "INTERATIVO",
                    color: chalk.green
            };
        default:
            if (text) {
                return {
                    icon: "💬",
                    type: "TEXTO",
                    color: chalk.white
                };
            }
            const typeName = String(firstKey || "Unknown").replace("Message", "");
            return {
                icon: "❔",
                    type: typeName || "Unknown",
                    color: chalk.gray
            };
    }
}

/**
 * Imprime Um Registro De Mensagens Detalhado Usando Um Layout De Tabela De Terminal.
 *
 * @param {Object} message
 * @param {Object} raw
 * @param {{
 *   command?: string,
 *   isCommand?: boolean,
 *   prefix?: string
 * }} [info]
 */
export function logNewMessage(message, raw, info = {}) {
    const {
        icon,
        type,
        color
    } = detectMessageKind(
        raw?.message,
        message?.text || ""
    );

    const senderName = message?.pushName || "Sem Nome";
    const maskedNumber = maskNumber(message?.sender);
    
    const isBot = Boolean(raw?.key?.fromMe);
    const isGroup = Boolean(message?.isGroup) || raw?.key?.remoteJid?.endsWith("@g.us");

    const isCommand = Boolean(info?.isCommand) && Boolean(info?.command);

    const chatType = isGroup ? "👥 Grupo" : "💬 Privado";
    const messageStatus = isBot ? "MENSAGEM ENVIADA" : "MENSAGEM NOVA";

    const boxColor = isBot ? chalk.green : isCommand ? chalk.cyan : isGroup ? chalk.magenta : chalk.blue;
    const borderColor = boxColor;

    const rows = [];
    rows.push(["Chat", `${chatType} ${chalk.gray(`(${maskNumber(message?.chat?.split("@")[0] || "—")})`)}`]);
    rows.push(["Remetente", `${senderName}${isBot ? chalk.green(" (Bot)") : ""}`]);
    rows.push(["Número", maskedNumber]);

    if (isCommand) {
        rows.push(["Comando", chalk.cyan(`${info?.prefix || "!"}${info.command}`)]);
    }

    rows.push(["Tipo", color(`${icon} ${type}`)]);

    const content = message?.text ? message.text.replace(/\n/g, " ⏎ ") : "";

    if (content) {
        rows.push(["Conteúdo", `"${color(content)}"`]);
    }

    rows.push(["Horário", chalk.gray(nowBR())]);

    const labelWidth = Math.max(...rows.map(([label]) => visibleLength(label)), 9);

    const valueWidth = Math.min(Math.max(...rows.map(([, value]) => visibleLength(value)), 20), 60);

    const totalWidth = labelWidth + valueWidth + 7;

    const topBorder = "╭" + "─".repeat(totalWidth) + "╮";
    const separator = "├" + "─".repeat(labelWidth + 2) + "┼" + "─".repeat(valueWidth + 2) + "┤";

    const bottomBorder = "╰" + "─".repeat(totalWidth) + "╯";

    console.log("");
    console.log(borderColor(topBorder));

    const titleText = `${icon}  ${messageStatus}`;
    const titlePadding = Math.max(0, totalWidth - visibleLength(titleText));

    console.log(borderColor("│") + " " + color(titleText) + " ".repeat(titlePadding) + " " + borderColor("│"));
    console.log(borderColor(separator));

    for (const [label, value] of rows) {
        const labelText = padRight(
            label,
            labelWidth
        );

        let valueText = String(value);


        if (visibleLength(valueText) > valueWidth) {
            const cleanValue = stripAnsi(valueText);

            valueText = cleanValue.slice(0, Math.max(0, valueWidth - 3)) + "...";
        }

        valueText = padRight(valueText, valueWidth);
        
        console.log(borderColor("│") + " " + chalk.bold(labelText) + " " + borderColor("│") + " " + valueText + " " + borderColor("│"));
    }

    console.log(borderColor(bottomBorder));
}

export const Utils = {
    texted,
    example,
    reSize,
    jsonFormat,
    nowBR,
    runtime,
    log,
    maskNumber,
    logNewMessage,
    sleep,
    rand
}
export default Utils;