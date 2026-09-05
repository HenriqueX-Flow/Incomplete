import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { serialize } from "#core/message.js";
import { isHelpRequest, buildHelp } from "#core/flags.js";
import { logError } from "./error.js";
import { addXp, getLevelProgress } from "#utils/levelSystem.js";
import { isPremium, revokePremium } from "#core/premium.js";
import { detectLinks, enforceAntilink } from "#whatsapp/antilink.js";
import { isOwnerJid } from "#core/owner.js";
import { renderImageLevelUp } from "#canvas/rankCardCanvas.js";
import { findClosestCommand } from "#utils/suggest.js";
import {
    Utils,
    fetchBufferWithTimeout,
    logNewMessage
} from "#core/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = path.join(__dirname, "plugins");

/**
 * @typedef {Object} PluginRun
 * @property {string[]} usage - Nomes/Aliases Do Comando
 * @property {string} [use] - Texto De Exemplo De Argumento
 * @property {string[]} [help] - Linhas De Ajuda Estilo Terminal (Opcional).
 *   Cada linha é uma "opção". É usado pelo `-h`/`--help` automático (ver
 *   src/core/flags.js > buildHelp). Ex: ["-on   Liga", "-off  Desliga"].
 * @property {string} category
 * @property {(m: import("./core/message.js").SimpleMessage, ctx: PluginContext) => Promise<any>} run
 * @property {boolean} [owner]
 * @property {boolean} [admin]
 * @property {boolean} [botAdmin]
 * @property {boolean} [group]
 * @property {boolean} [premium] - Se true, Só Quem É Premium (Ou O Dono) Pode Usar
 * @property {boolean} [hidden] - Se true, Não Aparece No !menu (Pra Comandos Que Só Existem Como Botão, Ex: duelo-atacar)
 * @property {number} [needLevel] - Nível Mínimo (Do Sistema De XP/Level) Pra Poder Usar O Comando
 */

/**
 * @typedef {Object} PluginContext
 * @property {import("./types/client.d.ts").ExtendedWASocket} client
 * @property {import("./core/database.js").Database} db
 * @property {import("./config.json")} config
 * @property {string} text - Texto Após O Comando
 * @property {string[]} args - Texto Após O Comando, Dividido Por Espaço
 * @property {string} command - Nome Do Comando Usado
 * @property {boolean} isPrefix
 * @property {Object} setting - Atalho Pra db.data.system
 * @property {typeof Utils} Utils
 * @property {{ usage: string[], category: string, use?: string }[]} plugins - Todos Os Plugins Carregados, Pro menu Montar Sozinho
 * @property {string|null} menuCategory - Categoria Pedida Quando O Comando Veio De Um Botão "menu-<categoria>"
 * @property {boolean} premium - Se Quem Mandou A Mensagem É Premium No Momento
 */

export class Handler {
    /**
     * @param {import("./types/client.d.ts").ExtendedWASocket} client
     * @param {import("./core/database.js").Database} db
     * @param {import("./config.json")} config
     */
    constructor(client, db, config) {
        this.client = client;
        this.db = db;
        this.config = config;
        /** @type {Map<string, {mod: any}>} */
        this.plugins = new Map();
        /** @type {Map<string, any>} Arquivo → Módulo Carregado Dele, Pra Saber O Que Limpar No Hot-Reload */
        this.pluginFiles = new Map();
        // Contador Quebrador De Cache Do Node: O import() Cacheia Por URL,
        // Então Cada Recarga Usa Um `?update=` Diferenete
        this.cacheBust = 0;
        this.loadPlugins();
        this.watchPlugins();
        this.db.data.statistic.startedAt = Date.now();
        this.db.save();
    }

    /**
     * Repõe O Limite De Uso De Todo Mundo De Tempos Em Tempos (Padrão: 24h).
     */
    resetLimitsIfNeeded() {
        const hours = this.config.limitResetHours ?? 24;
        const interval = hours * 60 * 60 * 1000;
        const last = this.db.data.system.lastLimitReset || 0;
        if (Date.now() - last < interval) return;

        for (const jid of Object.keys(this.db.data.users)) {
            const u = this.db.data.users[jid];
            u.limit = isPremium(u) ? this.config.premiumLimit ?? this.config.limit : this.config.limit;
        }
        this.db.data.system.lastLimitReset = Date.now();
        this.db.save();
    }

    /**
     * Dá XP Pro Remetente Da Mensagem, Respeitando Um Cooldown, E Avisa
     * No Chat Se Ele Subiu De Nível.
     * @param {import("./core/message.js").SimpleMessage} m
     */
    async grantXp(m) {
        const xpConfig = this.config.xp || {};
        const cooldown = xpConfig.cooldown ?? 60000;
        const user = this.db.getUser(m.sender);
        const now = Date.now();
        if (now - (user.lastXp || 0) < cooldown) return;

        user.lastXp = now;
        const oldLevel = getLevelProgress(user.xp || 0).level;
        const {
            leveledUp,
            level
        } = addXp(user, xpConfig.min ?? 8, xpConfig.max ?? 20);
        this.db.save();

        if (!leveledUp) return;

        const bonus = level * 10;
        user.nc = (user.nc || 0) + bonus;
        this.db.save();

        const number = m.sender.split("@")[0];
        const symbol = this.config.economy?.currencySymbol || "NC";
        const caption = `🎉 Parabéns @${number}, Você Subiu Para O Nível *${level}* Você Recebeu *${bonus}* ${symbol}.`;

        const sendTextFallback = () =>
            this.client.sendMessage(m.chat, {
                text: caption,
                mentions: [m.sender]
            }).catch((e) => logError("grantXp:notify", e));

        let avatarBuffer = null;
        const avatarUrl = await this.client.profilePicture(m.sender);
        if (avatarUrl) avatarBuffer = await fetchBufferWithTimeout(avatarUrl);

        try {
            const name = m.pushName || (await this.client.getName(m.sender)) || number;
            const buffer = await renderImageLevelUp({
                avatarBuffer,
                name,
                oldLevel,
                newLevel: level
            });
            await this.client.sendMessage(m.chat, {
                image: buffer,
                caption,
                mentions: [m.sender]
            });
        } catch (e) {
            logError("grantXp:renderImageLevelUp", e);
            await sendTextFallback();
        }
    }

    /**
     * Detecta Flood De Comandos Numa Janela Curta De Tempo E Aplica Um
     * "strike": No 1º Estouro Avisa E (OPCIONAL) Tira Um Pouco Do Limite
     * Se Floodar De Novo Depois De Avisado, Bane Automaticamente.
     * @param {import("./core/models.js").UserData} user
     * @returns {"warn"|"ban"|null}
     */
    checkFlood(user) {
        const cfg = this.config.antiflood || {};
        if (!cfg.enabled) return null;

        const windowMs = cfg.windowMs ?? 8000;
        const maxCommands = cfg.maxCommands ?? 5;
        const decayMs = cfg.decayMs ?? 3600000;
        const banAfterStrikes = cfg.banAfterStrikes ?? 2;
        const removeLimit = cfg.removeLimit ?? 0;
        const now = Date.now();

        if (user.lastFloodStrike && now - user.lastFloodStrike > decayMs) {
            user.floodStrikes = 0;
        }

        if (now - (user.floodWindowStart || 0) > windowMs) {
            user.floodWindowStart = now;
            user.floodCount = 0;
        }
        user.floodCount = (user.floodCount || 0) + 1;

        if (user.floodCount !== maxCommands + 1) {
            this.db.save();
            return null;
        }

        user.floodStrikes = (user.floodStrikes || 0) + 1;
        user.lastFloodStrike = now;

        if (user.floodStrikes >= banAfterStrikes) {
            user.banned = true;
            this.db.save();
            return "ban";
        }

        if (removeLimit) user.limit = Math.max(0, user.limit - removeLimit);
        this.db.save();
        return "warn";
    }

    /**
     * Verifica Se Uma Mensagem De Grupo Tem Um Link Banido E Aplica A Ação
     * Configurada. Roda Em TODA Mensagem De Grupo, Não Só Em Comandos
     * O Link Pode Vir Numa Mensagem Qualquer.
     * @param {import("./core/message.js").SimpleMessage} m
     * @returns {Promise<boolean>} true se a mensagem foi tratada (não deve seguir o fluxo normal)
     */
    async checkAntilink(m) {
        if (!m.isGroup) return false;

        const group = this.db.data.groups[m.chat];
        if (!group?.antilink || !Object.keys(group.antilink).length) return false;

        const isOwner = isOwnerJid(m.sender, this.config.owner);
        if (isOwner) return false;

        const isAdmin = await this.client.getAdmin(m.chat, m.sender);
        if (isAdmin) return false;

        const matchedType = detectLinks(m.text).find((type) => group.antilink[type]);
        if (!matchedType) return false;

        const {
            mode
        } = group.antilink[matchedType]
        const antilinkCfg = this.config.antilink || {};

        try {
            await enforceAntilink(this.client, m, mode, {
                protectDelayMs: antilinkCfg.protectDelayMs
            })
        } catch (e) {
            logError("antilink:enforce", e);
        }

        this.applyAntilinkPenalty(m.sender);
        return true;
    }

    /**
     * Penalidade Opcional No PRÓPRIO BOT (Não No Grupo) Por Mandar Link Banido.
     * Desativada Por Padrão, Só Entra Em Ação Se `antilinkPenalty.enabled`
     * Estiver Ligado No Config. É Separada Da Ação No Grupo (delete/remove/protect),
     * Que Sempre Acontece Independente Disso.
     * @param {string} senderJid
     */
    applyAntilinkPenalty(senderJid) {
        const cfg = this.config.antilinkPenalty || {};
        if (!cfg.enabled) return;

        const user = this.db.getUser(senderJid);
        if (cfg.removeLimit) user.limit = Math.max(0, user.limit - cfg.removeLimit);
        if (cfg.removePremium) revokePremium(user);

        user.antilinkStrikes = (user.antilinkStrikes || 0) + 1;
        if (cfg.banAfterStrikes && user.antilinkStrikes >= cfg.banAfterStrikes) {
            user.banned = true;
        }
        this.db.save();
    }

    /**
     * Carrega (Ou Recarrega) Todos Os Plugins Do Disco. Usa Uma URL Com
     * Query String Única Pra "Enganar" O Cache De Módulos Do Node.js E
     * Garantir Que O Código Editado Sempre Execute. Também Pode Ser
     * Chamado De Novo Depois De Editar Um Plugin.
     */
    async loadPlugins() {
        this.plugins.clear();
        this.pluginFiles.clear();
        const files = walk(PLUGINS_DIR).filter((f) => f.endsWith(".js"));
        for (const file of files) {
            try {
                const url = pathToFileURL(file).href + `?update=${++this.cacheBust}`;
                const mod = await import(url);
                if (!mod.run?.usage) continue;
                mod.run.__file = file;
                this.pluginFiles.set(file, mod);
                for (const name of mod.run.usage) {
                    this.plugins.set(name.toLowerCase(), mod);
                }
            } catch (e) {
                logError(`load:${file}`, e);
            }
        }
    }

    /**
     * Observa A Pasta De Plugins E Recarrega Tudo Automaticamente Quando
     * Algum Arquivo .js É Criado, Editado Ou Removido. O Linux Não
     * Suporta recursive: true No fs.watch, Então Adiciona Um Watcher Em
     * Cada Subpasta. O Debounce Evita Vários Reloads No Mesmo Save (Editores
     * Costumam Gravar O Arquivo 2 Vezes Seguidas).
     */
    watchPlugins() {
        const watched = new Set();
        let timer = null;

        const scheduleReload = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.loadPlugins()
                    .catch((e) => logError("watchPlugins:reload", e));
            }, 300);
        };

        const addWatcher = (dir) => {
            if (watched.has(dir)) return;
            watched.add(dir);

            try {
                fs.watch(dir, (_event, filename) => {
                    if (!filename || filename.endsWith(".js")) scheduleReload();
                });
            } catch (e) {
                logError(`watchPlugins:watch:${dir}`, e);
            }

            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (entry.isDirectory()) addWatcher(path.join(dir, entry.name));
            }
        };

        addWatcher(PLUGINS_DIR);
    }

    /**
     * Lista Todos Os Plugins Carregados Sem Repetir O Mesmo Módulo
     * (Um Módulo Pode Ter Vários Apelidos Dentro De `usage`).
     * Usado Pelo menu / menuall Pra Montar Tudo Automaticamente.
     * @returns {{ usage: string[], category: string, use?: string, file: string }[]}
     */
    getPluginList() {
        const seen = new Set();
        const list = [];
        for (const mod of this.plugins.values()) {
            if (seen.has(mod)) continue;
            seen.add(mod);
            if (mod.run.hidden) continue;
            list.push({
                usage: mod.run.usage,
                category: mod.run.category,
                use: mod.run.use,
                file: mod.run.__file
            });
        }
        return list.sort((a, b) => a.category.localeCompare(b.category));
    }

    /**
     * @param {import("baileys").proto.IWebMessageInfo} raw
     */
    async handle(raw) {
        if (!raw.message || raw.key.remoteJid === "status@broadcast" || raw.key.remoteJid?.endsWith("@newsletter")) return;

        const m = await serialize(this.client, raw, this.db);

        if (this.config.terminal?.messages !== false) {
            const prefix = this.config.prefix || ":";
            const isCommand = m.text.startsWith(prefix);
            const [command] = isCommand ? m.text.slice(prefix.length).trim().split(/\s+/) : [];
            logNewMessage(m, raw, {
                command,
                isCommand,
                prefix
            });
        }

        // Ignora SÓ As Mensagens Que O PRÓPRIO BOT Mandou (Evita Loop De Auto-
        // Resposta). NÃO Ignora Toda Mensagem fromMe: Se O Dono Usa O MESMO
        // Número Do Bot No Celular Dele, Os Comandos Que Ele Digitar Lá
        // Também Chegam Como fromMe — E Esses Precisam Rodar Normalmente.
        // Ver client.js > wasSentByBot E README > Mesmo Número Pro Bot E Pro Dono.
        if (raw.key.fromMe && this.client.wasSentByBot(raw.key.id)) return;

        if (this.db.data.system.autoread) {
            this.client.readMessages([raw.key]).catch((e) => logError("autoread", e));
        }

        if (await this.checkAntilink(m)) return;

        this.resetLimitsIfNeeded();
        this.grantXp(m).catch((e) => logError("grantXp", e));

        const prefix = this.config.prefix || ":";
        const isPrefix = m.text.startsWith(prefix);
        if (!isPrefix) return;

        const [command, ...args] = m.text.slice(prefix.length).trim().split(/\s+/);
        if (!command) return;
        const text = args.join(" ");

        let mod = this.plugins.get(command.toLowerCase());
        let menuCategory = null;
        if (!mod && command.toLowerCase().startsWith("menu-")) {
            mod = this.plugins.get("menu");
            menuCategory = command.toLowerCase().slice(5);
        }

        if (!mod) {
            const suggestion = findClosestCommand(command.toLowerCase(), this.getPluginList())
            if (suggestion) {
                return m.reply(`Comando "${command}" Não Existe. Você Quis Dizer "${suggestion.command}"? Use ${prefix}${suggestion.command} (Categoria: ${suggestion.category})`).catch((e) => logError("suggest", e))
            }
            return
        }

        // Help Automático Estilo TERMINAL: `:comando -h` / `:comando --help`
        // Responde Antes Do Plugin Rodar, Montado A Partir Do Próprio `run`
        // Dele (Ver src/core/flags.js > buildHelp). Ajuda Não Gasta Limite.
        if (isHelpRequest(args)) {
            return m.reply(buildHelp(mod.run, prefix));
        }

        const isOwner = isOwnerJid(m.sender, this.config.owner);
        const user = this.db.getUser(m.sender);
        const premium = isPremium(user);
        this.db.save();

        if (this.db.data.system.status === "private" && !isOwner) return m.reply("O Bot Está Em Modo Privado. Só O Dono Pode Usar Comandos.");
        if (user.banned && !isOwner) return m.reply("Você Foi Banido Do Bot.");

        if (!isOwner) {
            const flood = this.checkFlood(user);
            if (flood === "ban") {
                return m.reply(Utils.texted("bold", "Você Foi Banido Por Flood De Comandos."));
            }
            if (flood === "warn") {
                await m.reply(Utils.texted("bold", "Hmm. Você Está Mandando Comandos Muito Rápido. Espere Um Pouquinho."));
            }
        }

        if (mod.run.owner && !isOwner) return m.reply("Esse Comando Só Funciona Pro Dono Do Bot.");
        if (mod.run.premium && !premium && !isOwner) return m.reply("Esse Comando É Exclusivo Pra Membros Premium.");
        if (mod.run.group && !m.isGroup) return m.reply("Esse Comando Só Funciona Em Grupos.");

        if (mod.run.needLevel && !isOwner) {
            const {
                level
            } = getLevelProgress(user.xp || 0);
            if (level < mod.run.needLevel) {
                const name = await this.client.getName(m.sender);
                return m.reply(`${name}, Você Precisa Estar No Nível *${mod.run.needLevel}* Pra Usar Esse Comando. Seu Nível Atual É *${level}*.`);
            }
        }

        if (mod.run.group && m.isGroup) {
            const isAdmin = await this.client.getAdmin(m.chat, m.sender);
            const botIsAdmin = await this.client.getAdmin(m.chat, this.client.decodeJid(this.client.user.id));
            if (mod.run.admin && !isAdmin && !isOwner) return m.reply("Esse Comando Só Funciona Pra Administradores Do Grupo.");
            if (mod.run.botAdmin && !botIsAdmin) return m.reply("Eu Preciso Ser Administrador Do Grupo Pra Executar Esse Comando.");
        }

        if (!isOwner && user.limit <= 0) {
            const name = await this.client.getName(m.sender);
            return m.reply(`${name}, Seu Limite De Comandos Acabou. Espere O Reset (24h) Ou Vire Premium.`);
        }

        /** @type {PluginContext} */
        const ctx = {
            client: this.client,
            db: this.db,
            config: this.config,
            text,
            args,
            command: command.toLowerCase(),
            isPrefix,
            setting: this.db.data.system,
            Utils,
            plugins: this.getPluginList(),
            menuCategory,
            premium,
        }

        const autotyping = this.db.data.system.autotyping;
        try {
            if (!isOwner) {
                user.limit -= 1;
                this.db.save();
            }
            if (autotyping) await this.client.sendPresenceUpdate("composing", m.chat).catch(() => {});
            await mod.run.run(m, ctx);
            this.db.trackCommand();
        } catch (e) {
            logError(`plugin:${command}`, e);
            this.db.trackError();
            m.reply(Utils.jsonFormat(e));
        } /*finally {
            if (autotyping) this.client.sendPresenceUpdate("paused", m.chat).catch(() => {});
        }
        */
    }
}

/**
 * Lista Todos Os Arquivos .js Dentro De Uma Pasta, Recursivamente.
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, {
            withFileTypes: true
        })) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) results = results.concat(walk(full));
        else results.push(full);
    }

    return results;
}
