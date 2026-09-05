import { Utils } from "#core/utils.js";
import { logError } from "../error.js";

export const DEFAULT_WELCOME_MESSAGE = "Seja Bem-Vindo(a), @user 🎉\nEsperamos Que Aproveite O #grupo.";
export const DEFAULT_LEAVE_MESSAGE = "#user Saiu Do Grupo. 👋";

/**
 * Troca Os Placeholders De Um Template De Welcome/Leave Pelo Valor Real.
 *
 * - `@user` → Vira Uma Menção Clicável (Precisa Passar O Jid Em `mentions`
 *   Na Hora De Enviar A Mensagem, Ver `sendGreeting` Abaixo).
 * - `#user` → Vira O Nome (pushName) Da Pessoa, Sem Menção.
 * - `#grupo` → Vira O Nome Do Grupo No Momento (Bônus, Não Foi Pedido Mas É
 *   De Graça Já Que A Gente Já Busca O `groupMetadata`).
 *
 * @param {string} template
 * @param {{ userJid: string, userName: string, groupName?: string|null }} data
 * @returns {string}
 */
export function renderGreeting(template, {
    userJid,
    userName,
    groupName
}) {
    const number = userJid.split("@")[0];
    return String(template || "").replaceAll("@user", `@${number}`).replaceAll("#user", userName || number).replaceAll("#grupo", groupName || "o grupo");
}

/**
 * Manda A Mensagem De Welcome/Leave Tentando Se Comportar Como Uma Pessoa
 * Digitando, Não Um Bot Respondendo Instantaneamente Em 0ms Toda Vez Que
 * Alguém Entra/Sai. Ver README > Segurança Do Welcome/Leave.
 * @param {import("baileys").WASocket} client
 * @param {string} groupJid
 * @param {string} text
 * @param {string[]} mentions
 * @param {{ minDelayMs?: number, maxDelayMs?: number }} cfg
 */
async function sendGreeting(client, groupJid, text, mentions, cfg) {
    const minDelay = cfg.minDelayMs ?? 3000;
    const maxDelay = cfg.maxDelayMs ?? 12000;

    await Utils.sleep(Utils.rand(minDelay, maxDelay));
    
    await client.sendPresenceUpdate("composing", groupJid).catch(() => {});
    await Utils.sleep(Utils.rand(1500, 4000));
    await client.sendPresenceUpdate("paused", groupJid).catch(() => {});

    await client.sendMessage(groupJid, {
        text,
        mentions
    });
}

/**
 * Ponto De Entrada, Chamado Pelo index.js A Cada Evento
 * `group-participants.update` Do Baileys.
 * @param {import("baileys").WASocket} client
 * @param {import("../core/database.js").Database} db
 * @param {import("../config.json")} config
 * @param {{ id: string, participants: string[], action: string }} event
 */
export async function handleGroupParticipantsUpdate(client, db, config, event) {
    const {
        id: groupJid,
        participants,
        action
    } = event;

    if (action !== "add" && action !== "remove") return;

    const chat = db.getChat(groupJid);
    const setting = action === "add" ? chat.welcome : chat.leave;
    if (!setting?.enabled) return;

    const cfg = config.greetings || {};

    const maxBatch = cfg.maxBatchSize ?? 5;
    if (participants.length > maxBatch) return;

    let groupName = null;
    try {
        groupName = (await client.groupMetadata(groupJid))?.subject || null;
    } catch (e) {
        logError("greetings:groupMetadata", e);
    }

    const template = setting.message || (action === "add" ? DEFAULT_WELCOME_MESSAGE : DEFAULT_LEAVE_MESSAGE);

        for (let userJid of participants) {
        try {
            if (typeof userJid === "object" && userJid !== null) {
                userJid = userJid.id || userJid.jid || "";
            }

            userJid = String(userJid || "");
            

            if (!userJid.includes("@")) continue;

            const userName = (await client.getName(userJid)) || userJid.split("@")[0];
            const text = renderGreeting(template, {
                userJid,
                userName,
                groupName
            });
            await sendGreeting(client, groupJid, text, [userJid], cfg);
        } catch (e) {
            logError(`greetings:${action}`, e);
        }
    }
}
