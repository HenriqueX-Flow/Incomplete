/**
 * @typedef {Object} SimpleMessage
 * @property {string} chat - jid da conversa (grupo ou privado)
 * @property {string} sender - jid de quem enviou
 * @property {boolean} isGroup
 * @property {boolean} fromMe
 * @property {string} text - texto da mensagem
 * @property {string} pushName - nome que a pessoa colocou no próprio WhatsApp (pode vir vazio)
 * @property {string[]} mentionedJid - jids mencionados com @
 * @property {SimpleMessage|null} quoted - mensagem respondida, se houver
 * @property {import('baileys').proto.IWebMessageInfo} raw - mensagem original do Baileys
 * @property {(text: string) => Promise<any>} reply - responde na própria conversa
 */

/**
 * Pega O Texto De Qualquer Tipo De Mensagem (conversation, extendedText, etc).
 * O Proto Do Baileys Tem Um Tipo Diferente PRA Cada Formato De Mensagem,
 * Essa Função Só Evita Ter Que Checar Tudo Isso Na Mão Toda Hora.
 * @param {import("baileys").proto.IMessage} message
 * @returns {string}
 */
function extractText(message) {
    if (!message) return "";

    let interactiveId = "";
    const nativeFlow = message.interactiveResponseMessage?.nativeFlowResponseMessage;
    if (nativeFlow) {
        try {
            const params = JSON.parse(nativeFlow.paramsJson);
            interactiveId = params.id;
        } catch (e) {
            interactiveId = nativeFlow.id || "";
        }
    }

    return (message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption ||message.videoMessage?.caption || message.buttonsResponseMessage?.selectedButtonId || message.listResponseMessage?.singleSelectReply?.selectedRowId || message.templateButtonReplyMessage?.selectedId || interactiveId ||  "");
}


/**
 * Resolve Um Jid @lid Pro @s.whatsapp.net (Número Real) Correspondente.
 * @param {import('baileys').WASocket} client
 * @param {import('./database.js').Database} [db]
 * @param {string} jid
 * @param {string} chat
 * @returns {Promise<string>}
 */
async function resolveLid(client, db, jid, chat) {
    if (!jid || !jid.endsWith('@lid')) return jid;

    const known = db?.resolveLid(jid);
    if (known) return known;

    if (chat?.endsWith('@g.us')) {
        try {
            const metadata = await client.groupMetadata(chat);
            const participant = metadata.participants.find((p) => p.id === jid || p.lid === jid);
            if (participant?.phoneNumber) {
                db?.linkContact(jid, participant.phoneNumber);
                return participant.phoneNumber;
            }
        } catch {
        }
    }

    return jid;
}

/**
 * Varre Todos Os Grupos Que O Bot Participa E Guarda O Par @lid ↔ Número
 * De Cada Participante No `db.contacts`.
 * @param {import('baileys').WASocket} client
 * @param {import('./database.js').Database} db
 * @param {string} [singleGroupJid] - Se Passado, Só Reprocessa Esse Grupo (Mais Rápido Pra `group-participants.update`)
 * @returns {Promise<number>} Quantos Pares Novos/Atualizados Foram Guardados
 */
export async function linkAllGroupContacts(client, db, singleGroupJid) {
    if (!db) return 0;
    let linked = 0;

    try {
        const groups = singleGroupJid
            ? { [singleGroupJid]: await client.groupMetadata(singleGroupJid) }
            : await client.groupFetchAllParticipating();

        for (const group of Object.values(groups)) {
            if (!group?.participants) continue;
            for (const p of group.participants) {
                if (p?.id?.endsWith("@lid") && p?.phoneNumber) {
                    db.linkContact(p.id, p.phoneNumber);
                    linked++;
                }
            }
        }
    } catch (e) {
    }

    return linked;
}

/**
 * Transforma a mensagem crua do Baileys num objeto simples e previsível.
 * @param {import('baileys').WASocket} client
 * @param {import('baileys').proto.IWebMessageInfo} raw
 * @param {import('./database.js').Database} [db] - Pra Resolver/Guardar Pares @lid ↔ Número (Ver resolveLid)
 * @returns {Promise<SimpleMessage>}
 */
export async function serialize(client, raw, db) {
    const message = raw.message?.ephemeralMessage?.message || raw.message;
    const context = message?.extendedTextMessage?.contextInfo;
    const isGroup = raw.key.remoteJid?.endsWith('@g.us') || false;

    if (raw.key.remoteJid?.endsWith('@lid') && raw.key.remoteJidAlt) {
        db?.linkContact(raw.key.remoteJid, raw.key.remoteJidAlt, raw.pushName);
    }
    if (raw.key.participant?.endsWith('@lid') && raw.key.participantAlt) {
        db?.linkContact(raw.key.participant, raw.key.participantAlt, raw.pushName);
    }

    // remoteJidAlt/participantAlt = jid "alternativo" que o Baileys manda
    // quando o principal é um @lid (ver src/core/message.js:resolveLid pro porquê).
    const chat = raw.key.remoteJidAlt || (db?.resolveLid(raw.key.remoteJid)) || raw.key.remoteJid;
    let sender = raw.key.fromMe ? client.user.id : (raw.key.participantAlt || raw.key.participant || raw.key.remoteJidAlt || raw.key.remoteJid);
    sender = await resolveLid(client, db, sender, chat);

    /** @type {SimpleMessage} */
    const m = {
        chat,
        sender,
        isGroup,
        fromMe: raw.key.fromMe || false,
        text: extractText(message),
        pushName: raw.pushName || '',
        mentionedJid: context?.mentionedJid || [],
        quoted: null,
        raw,
        reply: (text) => client.sendMessage(chat, { text }, { quoted: raw })
    }

    if (context?.quotedMessage) {
        if (context.participant?.endsWith('@lid') && context.participantAlt) {
            db?.linkContact(context.participant, context.participantAlt);
        }
        const quotedSender = await resolveLid(client, db, context.participantAlt || context.participant, chat);
        m.quoted = {
            chat: m.chat,
            sender: quotedSender,
            isGroup: m.isGroup,
            fromMe: quotedSender === client.decodeJid(client.user.id),
            text: extractText(context.quotedMessage),
            mentionedJid: [],
            quoted: null,
            raw: { message: context.quotedMessage, key: context.stanzaId ? { remoteJid: chat, fromMe: quotedSender === client.decodeJid(client.user.id), id: context.stanzaId } : null },
            reply: (text) => client.sendMessage(m.chat, { text }, { quoted: raw })
        }
    }

    return m;
}