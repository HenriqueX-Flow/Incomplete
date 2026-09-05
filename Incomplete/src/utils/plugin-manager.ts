import { glob } from "glob";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { log } from "./logger.js";
import { readConfig } from "./data-manager.js";
import { CommandModule } from "@type/command-handler.js";

class PluginManager {
	pluginsDir: string;
	plugins: Map <string, CommandModule>;

	constructor(customDir?: string) {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		if (customDir) {
			this.pluginsDir = customDir;
		} else {
			const isSrc = __dirname.includes(path.sep + "src" + path.sep);
			this.pluginsDir = path.resolve(__dirname, isSrc ? "../plugins" : "../plugins");
		}
		this.plugins = new Map();
	}

	async loadAll() {
		const files = await glob("**/*.{ts,js,mjs}", {
			cwd: this.pluginsDir,
			absolute: true,
		});

		for (const f of files) await this.loadOne(f);
	}

	private resolveHandler(mod: any) {
		return (mod?.handler && typeof mod.handler === "function") ? mod.handler : (typeof mod?.default === "function" ? mod.default : mod.default?.handler);
	}

	async loadOne(absPath: string) {
		try {
			const url = pathToFileURL(absPath).href + `?v=${Date.now()}`;
			const mod = (await import(url)) as CommandModule;
			const name = path.relative(this.pluginsDir, absPath);
			this.plugins.set(name, mod);
			return mod;
		} catch (e: any) {
			log.error(`Um Plugin Não Pode Ser Carregado ${absPath}: ${e?.message || e}`);
		}
	}

	async dispatch(text: string, msg: any, m: any, flow: any, cfg: any) {
		const botCfg = cfg || readConfig();
		const prefix = botCfg.multi_prefix ? ["!", ".", "/", "#", "?", ":", "+"] : [botCfg.prefix];
		const usedPrefix = prefix.find((p) => text.startsWith(p)) || "";
		const commandText = usedPrefix ? text.slice(usedPrefix.length).trim() : (botCfg.no_prefix ? text.trim() : "");
		if (!commandText) return false;

		const args = commandText.split(/\s+/);
		const cmd = (args.shift() || "").toLowerCase();
		if (!botCfg.public && m.sender !== botCfg.owner) return;

		for (const [name, mod] of this.plugins.entries()) {
			const handler = this.resolveHandler(mod);
			if (typeof handler !== "function") continue;

			const candidates = ([] as any[]).concat(handler.command ?? handler.help ?? []);
			if (!candidates.length || !candidates.some((c) => c instanceof RegExp ? c.test(cmd) : typeof c === "string" && c.toLowerCase() === cmd)) continue;

			if (handler.owner && m.sender !== botCfg.owner) return await m.reply("Comando Exclusivo Para O Dono.");

			if (handler.admin) {
				const meta = await flow.groupMetadata(m.chat);
				const admins = meta.participants.filter((p: any) => p.admin).map((p: any) => p.id);
				if (!admins.includes(m.sender)) return await m.reply("Comando Exclusivo Para Admins Do Grupo.");
			}

			if (handler.botAdmin) {
				const meta = await flow.groupMetadata(m.chat);
				const botJid = flow.user?.lid?.split(":")[0] + "@lid";
				const admins = meta.participants.filter((p: any) => p.admin).map((p: any) => p.id);
				if (!admins.includes(botJid)) return await m.reply("O Bot Precisa Ser Administrador Para Usar Esse Comando.");
			}

			if (handler.group && !m.chat?.endsWith("@g.us")) return await m.reply("Este Comando Só Pode Ser Usado Em Grupos.");

			try {
				await handler(m, { flow, cfg: botCfg, pm: this, args, text: args.join(" ") });
				log.success(`Comando Encontrado E Executado: ${cmd} (${name})`);
				return true;
			} catch (e: any) {
				log.error(`Há Algum Erro No Comando ${cmd} (${name}): ${e?.stack || e}`);
				await m.reply("Ocorreu Um Erro Ao Tentar Executar Esse Comando.");
				return true;
			}
		}

		log.warn(`Nenhum Plugin Reconheceu O Comando: ${cmd}`);
        const menu = this.buildMenu(botCfg.prefix, "Incomplete", "HenriqueX");
        await m.reply(menu);	
        return false;
    }

    buildMenu(prefix: string, botName = "Incomplete", ownerName = "HenriqueX", filterTag?: string) {
        const out: any[] = [];

        for (const [, mod] of this.plugins) {
            const handler = (mod?.handler && typeof mod.handler === "function") ? mod.handler : (typeof mod.default === "function" ? mod.default : mod.default?.handler);
	
            if (typeof handler !== "function") continue;

            const tags = (handler.tags || ["outros"]).map((t: string) => t.toLowerCase());
            const help = handler.help || [];
            const command = handler.command;
            const desc = handler.desc || "";

            if (filterTag && !tags.some((t: string) => t.includes(filterTag.toLowerCase())))
                continue;

            out.push({ tags, help, command, desc });
        }

        const byTag = out.reduce((acc: Record<string, any[]>, cur) => {
            for (const t of cur.tags) {
                acc[t] = acc[t] || [];
                const cmds = Array.isArray(cur.command) ? [...new Set(cur.command.filter(Boolean))] : [cur.command].filter(Boolean);
		
                acc[t].push({
                    cmds,
                    help: cur.help,
                    desc: cur.desc
                });
            }
            return acc;
        }, {});

        if (filterTag && Object.keys(byTag).length === 0) {
            return `Nenhuma Categoria Encontrada Com O Nome: *${filterTag}*`;
        }

        let menu = "";
        let totalCommands = 0;

        const entries = Object.entries(byTag).sort(([a], [b]) => a.localeCompare(b));

        for (let i = 0; i < entries.length; i++) {
            const [tag, items] = entries[i];
            const upperTag = tag.toUpperCase();

            let emo = "🌟";
            if (/owner/i.test(tag)) emo = "⚙️";
                else if (/download|downloader/i.test(tag)) emo = "📦";
                else if (/media|tools|midias/i.test(tag)) emo = "💿";		
                else if (/fun|diversão|jogos/i.test(tag)) emo = "🎮";	
                else if (/group|grupos/i.test(tag)) emo = "👥";
	       
            let count = 0;
            for (const it of items) count += it.help?.length || it.cmds?.length || 0;
            totalCommands += count;

            menu += i === 0 ? `╭──❍「 *${upperTag}* 」❍ (${count} cmds)\n` : `╭─┴─❍「 *${upperTag}* 」❍ (${count} cmds)\n`;
	
            for (const it of items) {
                const list = it.help?.length ? it.help : it.cmds;
                for (const cmd of list) {
                    const descText = it.desc ? ` ${it.desc}` : "";
                    menu += `│ *${prefix}${cmd}*${descText}\n`;
                }
            }

            menu += i < entries.length - 1 ? `╰─┬────❍\n` : `╰──────❍\n`;
        }

        if (!filterTag) {
            menu = menu;
        }

        return menu.trim();
    }
}

export { PluginManager };
