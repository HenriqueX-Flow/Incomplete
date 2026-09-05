import { readConfig } from "@utils/data-manager.js";
import { PluginManager } from "@utils/plugin-manager.js";
import { Util } from "./context.js";
import chalk from "chalk";
import NodeCache from "node-cache";
import pino from "pino";
import * as readline from "readline";
import Table from "cli-table3";
import makeWASocket, {
    Browsers,
	DisconnectReason,
    fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState
} from "baileys";
import {
    log,
	showBanner,
	showSystemInfo
} from "@utils/logger.js";
import boxen from "boxen";

const startTime = Date.now();
const groupCache = new NodeCache({
	stdTTL: 30 * 60,
    useClones: false
});
const rl = readline.createInterface({
    input: process.stdin,
	output: process.stdout
});
const question = (text: string) => new Promise((resolve) => {
	rl.question(text, resolve);
});

class WAConnect {
	pm: PluginManager;
	cfg: any;
	flow: any;

	constructor(pluginManager: PluginManager, cfg: any) {
		this.pm = pluginManager;
		this.cfg = cfg;
	}

	async start() {
		const {
			saveCreds,
			state
		} = await useMultiFileAuthState("session");
		const {
			version
		} = await fetchLatestBaileysVersion();
		const level = pino({ level: "silent" });
		const safe = async (fn: () => Promise<any>, errMsg: string) => {
			try {
				await fn();
			} catch (e) {
				log.error(`${errMsg}: ${e}`);
			}
		};

		this.flow = makeWASocket({
			auth: {
				creds: state.creds,
				keys: makeCacheableSignalKeyStore(state.keys, level)
			},
			logger: level,
			version,
			syncFullHistory: false,
			emitOwnEvents: false,
            markOnlineOnConnect: true,
			browser: Browsers.ubuntu("Opera"),
			shouldIgnoreJid: (jid: string) => {
				return /(newslleter|bot)/.test(jid)
			},
			cachedGroupMetadata: async (jid) => groupCache.get(jid)
		});

		if (!this.flow.authState.creds.registered) {
            let phoneNumber = await question("Coloque Seu Número Do WhatsApp No Formato: 558888205721\nDigite Aqui : ");
			const code = await this.flow.requestPairingCode(phoneNumber);
			log.success(`Seu Código De Pareamento: ${code}`);
		}

		this.flow.ev.on("creds.update", saveCreds);
		this.flow.ev.on("connection.update", (u: any) => {
			const {
				connection,
				lastDisconnect
			} = u;

			if (connection === "close") {
				const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
				log.warn(`Conexão Fechada. Reconectar: ${shouldReconnect}`);
				if (shouldReconnect)
					this.start();
			} else if (connection === "connecting") {
				showSystemInfo();
			} else if (connection === "open") {
				showBanner();
			}
		});

		//@ts-ignore
		this.flow.ev.on("messages.upsert", async ({ messages }) => {
			const botCfg = readConfig();
			for (const msg of messages) {
				const timeStamp = (msg.messageTimestamp || 0) * 1000;
				if (timeStamp < startTime) {
					continue;
				}

				if (botCfg.auto_read_msg) await safe(() => this.flow.readMessages([msg.key]), "O Bot Não Conseguiu Ler A Nova Mensagem");

				if (botCfg.auto_type_msg && msg.key.remoteJid) await safe(
					() => this.flow.sendPresenceUpdate("composing", msg.key.remoteJid),
					"O Bot Não Conseguiu Simular A Digitação"
				);

				try {
					const {
						key,
						message,
					} = msg;
					if (!message || !key.remoteJid)
						continue;

					const sender = key.remoteJid;
					const isGroup = sender.endsWith("@s.us");
					const location = isGroup ? "Chat Em Grupo" : "Chat Privado";

					const messageType = Object.keys(message || {})[0];
					let content = (() => {
						switch (messageType) {
							case "conversation": return message.conversation;
							case "extendedTextMessage": return message.extendedTextMessage.text;
							default: return `[${messageType}]`;
						}
					})();

					if (content.length > 60)
						content = content.slice(0, 60) + "...";

                    console.log(boxen(`${chalk.white.bold("Mensagem De")} ${chalk.bold(msg.pushName || "Desconhecido")}\n` + `${chalk.white.bold("Conteúdo:")} ${chalk.white.bold(content)}`, {
                        padding: 1,
                        borderColor: "cyan",
                        borderStyle: "doubleSingle"
                    }));
                    const table = new Table({
                        head: [chalk.white.bold("Chave"), chalk.white.bold("Valor")],
                        colWidths: [10, 20],
                        wordWrap: true
                    });

                    table.push([chalk.white.bold("Local"), location], [chalk.white.bold("Tipo"), messageType], [chalk.white.bold("Remetente"), sender])
                    console.log(table.toString());
                    await this.onMessage(msg);
                } catch (e) {
                    log.error(`Erro No onMessage: ${e}`);
				}
			}
		});
    }

	async onMessage(msg: any) {
		const m = new Util(this.flow, msg);
		const cfg = readConfig();
		const body = (m.text || "").trim();
		if (!body) return;

        const prefix = cfg.multi_prefix ? ["!", ".", "/", "#", "?", ":", "+"] : [cfg.prefix];
		const hasPrefix = prefix.some((p) => body.startsWith(p));

		if (!hasPrefix && !cfg.no_prefix) return;

		const cleanBody = body.replace(/@\d+(@[a-z.]+)?/gi, "").trim();

		await this.pm.dispatch(cleanBody, msg, m, this.flow, cfg);
	}
}

export {
	WAConnect
};
