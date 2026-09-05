/**
 * ============================================================================
 * SISTEMA DE FLAGS (ESTILO TERMINAL/CLI) — REGRA ÚNICA, VALE PRO BOT INTEIRO
 * ============================================================================
 * Um Comando Pode Ter 3 Tipos De "Pedaço", Sempre Nessa Ordem:
 *
 *   1. AÇÃO      -algumacoisa      (1 Traço Só, Sempre O 1º Token, OPCIONAL)
 *                                  Escolhe "o quê fazer" quando o comando tem
 *                                  mais de um modo (ex: -add, -delete, -nc).
 *
 *   2. FLAGS      --nome valor     (2 Traços, Pode Vir Em Qualquer Ordem)
 *                                  Dado Nomeado. Se Não Tiver Valor Depois
 *                                  (Ou O Próximo Token For Outra --flag),
 *                                  Vira `true` (Liga/Desliga, Tipo --full).
 *
 *   3. POSICIONAL  (Sobra)         Qualquer Token Que Não For Ação Nem Flag.
 *                                  Ex: `:give -nc 5511999999999 100` → o
 *                                  número e o "100" são posicionais.
 *
 * Nem Todo Comando Usa Os 3 — Tem Comando Só Com Flags (`:config --style 2`),
 * Só Com Posicional (`:ban @alguém`), Ou Os 3 Juntos (`:give -nc --user @x
 * --amount 100` == `:give -nc @x 100`, As Duas Formas São Equivalentes).
 *
 * IMPORTANTE: `positional` Já Vem SEM O Token Da Ação. Se Um Plugin Precisar
 * De Um Argumento "Cru" (Sem --flag), Use SEMPRE `positional`, Nunca O Array
 * `args` Original — Senão, Quando O Usuário Usar Uma Ação (`-nc`, `-add`...),
 * `args[0]` Vai Ser A Própria Ação (Ex: `"-nc"`) Em Vez Do Valor Esperado.
 * ============================================================================
 *
 * @typedef {Object} ParsedFlags
 * @property {string|null} action - A "Ação" Do Comando (ex: -add -> "add"), Ou null Se Não Tiver.
 * @property {Object.<string, string|true>} flags - Valores Dos --flags (true Se O Flag Não Tiver Valor Depois).
 * @property {string[]} positional - Tokens Que Sobraram (Não São Ação Nem --flag/Valor De Flag), Na Ordem Original.
 */

/**
 * Interpreta Argumentos Estilo Terminal: Uma Ação Com Um Traço (-add, -delete)
 * Seguida De Flags Com Dois Traços E Valor (--user @alguém --t 5m), Mais
 * Qualquer Sobra Vira `positional`.
 *
 * Exemplo: parseFlags(["-add", "--user", "@joao", "--t", "5m"])
 * → { action: "add", flags: { user: "@joao", t: "5m" }, positional: [] }
 *
 * Exemplo (Misturando Ação + Posicional, Sem --user):
 * parseFlags(["-nc", "5511999999999", "100"])
 * → { action: "nc", flags: {}, positional: ["5511999999999", "100"] }
 *
 * @param {string[]} args
 * @returns {ParsedFlags}
 */
export function parseFlags(args) {
    let action = null;
    const flags = {};
    const positional = [];
    let i = 0;

    // Só Conta Como Ação Se Tiver EXATAMENTE 1 Traço No Início E Mais Algum
    // Caractere Depois (Pra Um "-" Sozinho, Ou Um Número Negativo Tipo "-5"
    // Usado Como Valor Posicional, Não Virar Ação Por Acidente).
    if (args[0]?.startsWith("-") && !args[0].startsWith("--") && args[0].length > 1 && !/^-\d/.test(args[0])) {
        action = args[0].slice(1).toLowerCase();
        i = 1;
    }

    for (; i < args.length; i++) {
        const token = args[i];
        if (token.startsWith("--")) {
            const key = token.slice(2).toLowerCase();
            const next = args[i + 1];
            if (next !== undefined && !next.startsWith("--")) {
                flags[key] = next;
                i++;
            } else {
                flags[key] = true;
            }
            continue;
        }
        positional.push(token);
    }

    return {
        action,
        flags,
        positional
    }
}

/**
 * Resolve O "Alvo" De Um Comando (Um Usuário) Em Uma Ordem Fixa De Prioridade:
 * Menção > Mensagem Respondida (Quoted) > Texto Passado Como Fallback (Número
 * Ou @jid). Centraliza Uma Lógica Que Antes Tava Copiada Em Vários Plugins
 * (ban, premium, add, group).
 *
 * @param {import("baileys").WASocket} client
 * @param {import("./message.js").SimpleMessage} m
 * @param {string|true|undefined|null} fallbackRaw - Normalmente flags.user, args[0] Ou text.
 * @returns {Promise<string|null>} O Jid Resolvido, Ou null Se Não Achou/Inválido.
 */
export async function resolveTarget(client, m, fallbackRaw) {
    const raw = m.mentionedJid?.[0] || m.quoted?.sender || (fallbackRaw === true ? null : fallbackRaw);
    if (!raw) return null;

    const str = String(raw).trim();
    if (!str) return null;
    if (str.includes("@")) return client.decodeJid(str);

    const [result] = await client.onWhatsApp(str.replace(/\D/g, ""));
    if (!result?.exists) return null;
    return client.decodeJid(result.jid);
}

const DURATION_UNITS = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
}

/**
 * ============================================================================
 * HELP AUTOMÁTICO (ESTILO TERMINAL): `-h` E `--help`
 * ============================================================================
 * SEU COMANDO TEM AJUDA AUTOMÁTICA DE GRAÇA. O handler.js (handle()) captura
 * `-h` / `--help` ANTES DO PLUGIN RODAR e responde com uma ajuda uniforme
 * montada a partir do próprio `run` do plugin:
 *
 *   :welcome -h
 *   :welcome --help
 *
 * A resposta é derivada de `run.usage` (nomes), `run.category`, `run.use`
 * (exemplo de uso) e das flags de permissão (owner/admin/premium/grupo...).
 *
 * Além disso, se o plugin quiser documentar cada flag/posicional, ele pode
 * declarar (OPCIONAL) `run.help` — uma lista de linhas explicativas. Se não
 * declarar, o help ainda funciona (só usa o que já tem).
 *
 *   export const run = {
 *     usage: ["welcome", "boasvindas"],
 *     use: "-on | -off | -msg Bem-vindo(a) @user ao #grupo!",
 *     help: [
 *       "-on        Liga as boas-vindas no grupo",
 *       "-off       Desliga",
 *       "-msg <txt> Troca a mensagem (placeholders: @user, #user, #grupo)"
 *     ],
 *     ...
 *   }
 * ============================================================================
 */

/**
 * Deteta Se O Comando Foi Um Pedido De Ajuda (`-h` / `--help`).
 * Consegue No Começo Ou No Meio (Ex: `:x --style 1 --help`).
 * Não há caso real em que `-h`/`--help` seja um valor legítimo de flag,
 * então checar em qualquer posição é seguro e o mais próximo de terminal.
 * @param {string[]} args - Array Cru Do Comando (o `args` do ctx).
 * @returns {boolean}
 */
export function isHelpRequest(args) {
    if (!args?.length) return false;
    return args.some((a) => a === "-h" || a === "--help");
}

/**
 * Monta O Texto De Ajuda Padrão De Um Plugin, Usando Só O Que Ele Declarou
 * No `run`. É O "Uso:" central — mesmo formato em TODO comando. Texto
 * Fixo Em Português (pt-BR), Sem Sistema De Tradução.
 * @param {{usage?: string[], category?: string, use?: string, help?: string[], owner?: boolean, admin?: boolean, premium?: boolean, group?: boolean, botAdmin?: boolean}} plugin - O `run` do plugin.
 * @param {string} prefix
 * @param {string} [suffix] - Texto extra opcional (ex: mais detalhes do plugin)
 * @returns {string}
 */
export function buildHelp(plugin, prefix, suffix) {
    const translate = (key, vars) => {
        const map = {
            "help.title": "*📖 Ajuda — {command}*",
            "help.category": "Categoria: {category}",
            "help.usage": "Uso:",
            "help.aliases": "Apelidos: {list}",
            "help.options": "Opções:",
            "help.requirements": "Requisitos: {perms}",
            "help.permOwner": "Só Dono",
            "help.permAdmin": "Só Admin",
            "help.permPremium": "Premium",
            "help.permGroup": "Grupo",
            "help.permBotAdmin": "Bot Precisa Ser Admin"
        };
        const raw = map[key] ?? key;
        return raw.replace(/\{(\w+)\}/g, (match, name) => (vars?.[name] !== undefined ? String(vars[name]) : match));
    };
    const name = plugin.usage?.[0] || "comando";
    const lines = [];
    lines.push(translate("help.title", {
        command: `${prefix}${name}`
    }));
    if (plugin.category) lines.push(translate("help.category", {
        category: plugin.category
    }));
    lines.push("");
    lines.push(translate("help.usage"));
    if (plugin.use) {
        lines.push(`  ${prefix}${name} ${plugin.use}`);
    } else {
        lines.push(`  ${prefix}${name}`);
    }
    if (plugin.usage?.length > 1) {
        lines.push(translate("help.aliases", {
            list: plugin.usage.map((u) => `${prefix}${u}`).join(", ")
        }));
    }
    lines.push("");
    if (plugin.help?.length) {
        lines.push(translate("help.options"));
        for (const line of plugin.help) lines.push(`  ${line}`);
        lines.push("");
    }
    const perms = [];
    if (plugin.owner) perms.push(translate("help.permOwner"));
    if (plugin.admin) perms.push(translate("help.permAdmin"));
    if (plugin.premium) perms.push(translate("help.permPremium"));
    if (plugin.group) perms.push(translate("help.permGroup"));
    if (plugin.botAdmin) perms.push(translate("help.permBotAdmin"));
    if (perms.length) lines.push(translate("help.requirements", {
        perms: perms.join(" · ")
    }));
    if (suffix) lines.push("", suffix);
    return lines.join("\n");
}

/**
 * Converte Um Texto Tipo "5m", "2h", "1d", "30s" Em Milissegundos.
 * @param {string} text
 * @returns {number|null} null Se O Texto Não For Um Formato Válido
 */
export function parseDuration(text) {
    const match = /^(\d+)\s*(s|m|h|d)$/i.exec(String(text).trim());
    if (!match) return null;
    return Number(match[1]) * DURATION_UNITS[match[2].toLowerCase()];
}

/**
 * Formata Milissegundos De Volta Pra Um Texto Tipo "5 Minutos" (Bem Básico,
 * Só Pra Mensagens De Confirmação Ficarem Legíveis).
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hora${hours === 1 ? "" : "s"}`;
    const days = Math.round(hours / 24);
    return `${days} dia${days === 1 ? "" : "s"}`;
}