import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    isJidBot,
    isJidBroadcast,
    isJidNewsletter,
    isJidStatusBroadcast
} from "baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path"
import qrcodeTerminal from "qrcode-terminal";

import { Utils } from "#core/utils.js";
import config from "./config.json" with { type: "json" };
import { attachMethods } from "./client.js";
import { Database } from "#core/database.js";
import { Handler } from "./handler.js";
import { logError } from "./error.js";
import { linkAllGroupContacts } from "#core/message.js";
import { handleGroupParticipantsUpdate } from "#whatsapp/greetings.js";

const db = new Database(config.database);

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));

function countPluginFiles(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, {
            withFileTypes: true
        })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) count += countPluginFiles(full);
        else if (entry.name.endsWith(".js")) count++
    }
    return count;
}

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("../session");
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        auth: state,
        browser: config.session.browser,
        logger: pino({ level: "silent" }),
        shouldIgnoreJid: (jid) => isJidBot(jid) || isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
    });

    /** @type {import("./client.d.ts").ExtendedWASocket} */
    const clientExt = client;

    attachMethods(clientExt, { db });

    if (config.session.usePairingCode && !client.authState.creds.registered) {
        const number = config.session.phoneNumber;

        if (!number) {
            Utils.log.warn("Falha No Pareamento", "Você Ativou usePairingCode Mas Não Colocou O `phoneNumber` No config.json");
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                const cleanNumber = number.replace(/\D/g, "");
                let code_key = await client.requestPairingCode(cleanNumber);

                code_key = code_key?.match(/.{1,4}/g)?.join("-") || code_key;

                console.log(`CÓDIGO DE PAREAMENTO: ${code_key}\n`);
            } catch (err) {
                logError("pairingCodeRequest", err);
            }
        }, 3000);
    }

    const handler = new Handler(clientExt, db, config);

    client.ev.on("creds.update", saveCreds);

    client.ev.on("connection.update", async (up) => {
        const {
            connection,
            lastDisconnect,
            qr
        } = up;

        if (qr && !config.session.usePairingCode) {
            console.log("\nEscaneie o QR Code Abaixo:\n");
            qrcodeTerminal.generate(qr, {
                small: true
            });
        }

        if (connection === "close") {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(shouldReconnect ? "Reconectando..." : "Deslogado — Apague `session` E Rode De Novo.")
            if (shouldReconnect) start();
        } else if (connection === "open") {
            linkAllGroupContacts(clientExt, db).then((n) => {
                if (n) console.log(`${n} Pares @lid ↔ Número Carregados Dos Grupos.`);
            }).catch((e) => logError("linkAllGroupContacts", e));
        }
    });

    client.ev.on("group-participants.update", (event) => {
        linkAllGroupContacts(clientExt, db, event.id).catch((e) => logError("group-participants.update", e));
        handleGroupParticipantsUpdate(clientExt, db, config, event).catch((e) => logError("greetings", e));
    });

    client.ev.on("messages.upsert", async ({
        messages
    }) => {
        for (const raw of messages) {
            handler.handle(raw).catch((e) => logError("messages.upsert", e));
        }
    });

    process.on("uncaughtException", (e) => logError("uncaughtException", e));
    process.on("unhandledRejection", (e) => logError("unhandledRejection", e));
}

if (!fs.existsSync("../database")) fs.mkdirSync("../database");

await start();
