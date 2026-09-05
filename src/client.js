import {
    jidNormalizedUser,
    proto,
    generateWAMessageContent,
    generateWAMessageFromContent,
    downloadMediaMessage
} from "baileys";
import { logError } from "./error.js";
import { reSize } from "#core/utils.js";
import { config } from "shelljs";

/**
 * @typedef {import("baileys").WASocket} WASocket
 */

const MEDIA_KEYS = ["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"];

/**
 * Acha A Mídia Baixável Numa Mensagem: Olha Primeiro Na Própria Mensagem,
 * Depois Na Mensagem Citada (Quando Alguém Responde Uma Mídia Com Um Comando).
 * @param {import("baileys").proto.IWebMessageInfo} raw
 * @returns {{ key: import("baileys").proto.IMessageKey, message: import("baileys").proto.IMessage, type: string } | null}
 */
function findMediaMessage(raw) {
    const own = MEDIA_KEYS.find((k) => raw.message?.[k]);

    if (own) return {
        key: raw.key,
        message: raw.message,
        type: own.replace("Message", "")
    }

    const context = raw.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage;
    const quotedType = quoted && MEDIA_KEYS.find((k) => quoted[k]);

    if (quotedType) {
        return {
            key: {
                ...raw.key,
                id: context.stanzaId,
                participant: context.participant || raw.key.remoteJid
            },
            message: quoted,
            type: quotedType.replace("Message", "")
        }
    }

    return null;
}

/**
 * Adiciona Métodos Utilitários Ao Socket Do Baileys, Pra Você Não
 * Precisar Reescrever A Mesma Lógica Em Cada Plugin. Chame Essa
 * Função Uma Vez Logo Depois De Criar O Socket Com makeWASocket().
 *
 * O Tipo De Retorno É `ExtendedWASocket` (Declarado Em client.d.ts), Que
 * Estende O `WASocket` Do Baileys Com Os Métodos `reply`, `sendButton`,
 * `downloadMedia`, Etc. Assim O Autocomplete Do Editor
 * Conhecem Os Métodos Extras Sem Reclamar.
 *
 * @param {import("./types/client.d.ts").ExtendedWASocket} client
 * @param {{ db: import("./core/database.js").Database }} ctx
 * @returns {import("./types/client.d.ts").ExtendedWASocket}
 */
export function attachMethods(client, ctx) {
    const sentMessageIds = new Set();

    function trackSentId(id) {
        if (!id) return;
        sentMessageIds.add(id);
        setTimeout(() => sentMessageIds.delete(id), 2 * 60 * 1000).unref();
    }

    /**
     * Diz Se Um Id De Mensagem Foi Gerado Por Uma Mensagem Que O Próprio
     * Bot Mandou (E Não Pelo Dono Digitando No Celular Dele, Mesmo Que Os
     * Dois Compartilhem O Mesmo Número E Apareçam Como "fromMe").
     * @param {string} id
     * @returns {boolean}
     */
    client.wasSentByBot = (id) => sentMessageIds.has(id);

    const originalSendMessage = client.sendMessage.bind(client);
    client.sendMessage = async (...sendArgs) => {
        const result = await originalSendMessage(...sendArgs);
        trackSentId(result?.key?.id);
        return result;
    };

    const originalRelayMessage = client.relayMessage.bind(client);
    client.relayMessage = async (jid, message, options = {}) => {
        trackSentId(options.messageId);
        return originalRelayMessage(jid, message, options);
    };

    /**
     * Envia Uma Resposta Simples Citando A Mensagem Original.
     * @param {string} jid
     * @param {string} text
     * @param {import("baileys").proto.IWebMessageInfo} raw - Normalmente m.raw
     */
    client.reply = (jid, text, raw) =>
        client.sendMessage(jid, {
            text
        }, {
            quoted: raw
        });

    /**
     * Remove O Sufixo Do Jid, Deixando Só O Formato @s.whatsapp.net
     * @param {string} jid
     * @returns {string}
     */
    client.decodeJid = (jid) => (jid ? jidNormalizedUser(jid) : jid);

    /**
     * Pega O Nome Salvo De Um Contato, Ou O Número Caso Não Tenha Nome.
     * @param {string} jid
     * @returns {Promise<string>}
     */
    client.getName = async (jid) => {
        return ctx.db?.getContactName(jid) || jid.split("@")[0];
    }

    /**
     * Verifica Se Um Usuário É Admin No Grupo.
     * @param {string} groupJid
     * @param {string} userJid
     * @returns {Promise<boolean>}
     */
    client.getAdmin = async (groupJid, userJid) => {
        const metadata = await client.groupMetadata(groupJid);
        userJid = client.decodeJid(userJid);

        const participant = metadata.participants.find(p => {
            return (client.decodeJid(p.id) === userJid || client.decodeJid(p.phoneNumber) === userJid);
        });

        return !!participant?.admin;
    }

    /**
     * Acha Os Dados De Um Participante Dentro De Um Grupo.
     * @param {string} groupJid
     * @param {string} userJid
     * @returns {Promise<import("baileys").GroupParticipant|null>}
     */
    client.getJidFromParticipants = async (groupJid, userJid) => {
        const metadata = await client.groupMetadata(groupJid);
        return metadata.participants.find((p) => p.id === userJid) || null;
    }

    /**
     * Baixa A Foto De Perfil De Um Jid (Ou Retorna null Se Não Tiver).
     * @param {string} jid
     * @param {number} [timeoutMs]
     * @returns {Promise<string|null>}
     */
    client.profilePicture = async (jid, timeoutMs = 8000) => {
        try {
            const resolved = jid?.endsWith("@lid") ? (ctx.db?.resolveLid(jid) || jid) : jid;

            return await client.profilePictureUrl(resolved, "image", timeoutMs)
        } catch {
            return null
        }
    }

    /**
     * @typedef {Object} SendInteractiveOptions
     * @property {string} [text] - Corpo Da Mensagem
     * @property {string} [footer]
     * @property {string} [title] - Título Do Cabeçalho (Opcional)
     * @property {string} [subtitle]
     * @property {boolean} [ai] - Marca A Mensagem Como Enviada Por Bot
     * @property {import("./whatsapp/buttons.js").MixedButton[]} buttons
     * @property {string[]} [mentions]
     * @property {import("baileys").proto.IWebMessageInfo} [quoted]
     * @property {import("baileys").AnyMessageContent} [media] - ex: { image: fs.readFileSync("./imagem.jpg") }
     * @property {Record<string, any>} [messageJson]
     */

    /**
     * Envia Uma Mensagem Interativa (Botões / Lista / Link).
     * Use Os Helpers De src/whatsapp/buttons.js (quickReplyButton, urlButton, listButton)
     * Pra Montar O Array De `buttons` Sem Escrever O JSON Na Mão.
     * @param {string} jid
     * @param {SendInteractiveOptions} opts
     */
    client.sendInteractive = async (jid, opts) => {
        const {
            text = "",
                footer = "",
                title,
                subtitle,
                ai = false,
                buttons,
                mentions = [],
                quoted,
                media,
                messageJson
        } = opts;

        const header = media ? {
            title,
            subtitle,
            hasMediaAttachment: true,
            ...(await generateWAMessageContent(media, {
                upload: client.waUploadToServer
            }))
        } : {
            title,
            subtitle,
            hasMediaAttachment: false
        };

        const nativeFlow = { buttons };
        if (messageJson) {
            nativeFlow.messageParamsJson = JSON.stringify(messageJson);
        }

        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: footer
                        }),
                        header: proto.Message.InteractiveMessage.Header.create(header),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create(nativeFlow),
                        contextInfo: {
                            mentionedJid: mentions,
                            ...(quoted ? {
                                stanzaId: quoted.key?.id,
                                remoteJid: quoted.key?.remoteJid,
                                participant: quoted.key?.participant || quoted.key?.remoteJid,
                                fromMe: quoted.key?.fromMe,
                                quotedMessage: quoted.message
                            } : {})
                        }
                    })
                }
            }
        }, {
            userJid: client.user?.id
        });

        return client.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            additionalNodes: [{
                    tag: "biz",
                    attrs: {},
                    content: [{
                        tag: "interactive",
                        attrs: {
                            type: "native_flow",
                            v: "1"
                        },
                        content: [{
                            tag: "native_flow",
                            attrs: {
                                v: "9",
                                name: "mixed"
                            }
                        }]
                    }]
                },
                ...(ai ? [{
                    tag: "bot",
                    attrs: {
                        biz_bot: "1"
                    }
                }] : [])
            ]
        });
    }

    /**
     * Verifica Se A Mensagem (Ou A Mensagem Citada) Tem Mídia Baixável, Sem Baixar De Fato.
     * Útil Pra Checar Antes De Mandar O Usuário Esperar.
     * @param {import("baileys").proto.IWebMessageInfo} raw
     * @returns {"image"|"video"|"audio"|"sticker"|"document"|null}
     */
    client.hasMedia = (raw) => findMediaMessage(raw)?.type || null;

    /**
     * Baixa A Mídia De Uma Mensagem (Imagem, Vídeo, Áudio, Figurinha Ou Documento).
     * Funciona Tanto Se A Mídia Tá Na Própria Mensagem Quanto Se É Uma Mensagem
     * Citada (O Usuário Respondeu Uma Mídia Com O Comando).
     * @param {import("baileys").proto.IWebMessageInfo} raw - Normalmente m.raw
     * @returns {Promise<Buffer|null>} - null Se Não Tinha Mídia Ou Se Falhou O Download
     */
    client.downloadMedia = async (raw) => {
        try {
            const found = findMediaMessage(raw);
            if (!found) return null;
            const buffer = await downloadMediaMessage({
                key: found.key,
                message: found.message
            }, "buffer", {});
            return buffer
        } catch (e) {
            logError("client.downloadMedia", e);
            return null;
        }
    }

    /**
     * @typedef {Object} SendRichHtmlOptions
     * @property {string} id - Identificador Único Da Interação
     * @property {string} title - Título Mostrado No Cliente
     * @property {string} html - O HTML Que O Cliente Vai Renderizar
     * @property {string} [source] - Fonte "Confiavel" Pro Mecanismo Interno
     */

    /**
     * Envia Uma Mensagem HTML Rica Usando Um Recurso INTERNO Do Protocolo
     * Do WhatsApp (O Mesmo Tipo De Payload Que O Meta AI Usa).
     *
     * ⚠️ AVISO — RECURSO DE TESTE: Isso Explora Um `__typename` Interno do
     * WhatsApp (`GenAIaeacdsnwHtmlPrimitive`) E Um `botJid` "Hardcoded".
     * Pode NÃO Funcionar Na Sua Versão Do WhatsApp, Pode Não Funcionar
     * Direito No iOS/Desktop, E Pode Parar De Funcionar A Qualquer Momento.
     * NÃO Use Pra Nada Crítico. (Adaptado do minigame.js pra ESM.)
     * @param {string} jid
     * @param {SendRichHtmlOptions} opts
     */
    client.sendRichHtml = async (jid, { id, title, html, source = "testsource" }) => {
        const responseId = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload = {
            response_id: responseId,
            sections: [{
                view_model: {
                    primitive: {
                        __typename: "GenAIaeacdsnwHtmlPrimitive",
                        payload: html,
                        trusted_sources: [source]
                    },
                    __typename: "GenAISingleLayoutViewModel"
                }
            }]
        };

        await client.relayMessage(jid, {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    messageDisclaimerText: "",
                    botResponseId: responseId
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: title }],
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify(payload)).toString("base64")
                        },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }, {});
    }

    /**
     * Manda Uma Mensagem De Documento Com "Cartão De Link" Clicável (Foto + Título +
     * Descrição, Tipo Quando Você Cola Um Link No WhatsApp E Aparece A Prévia).
     * @param {string} jid
     * @param {LinkCardOptions} opts
     */
    client.sendLinkCard = async (jid, opts) => {
        const {
            text = "",
            title = "",
            body = "",
            description,
            largerThumbnail = true,
            thumbnail,
            thumbnailUrl,
            sourceUrl,
            adTag = false
        } = opts;

        const link = thumbnailUrl || sourceUrl || "";

        client.sendMessage(jid, {
            document: { url: link },
            mimetype: "image/jpeg",
            fileName: "X - Extends Nemesis",
            caption: text,
            contextInfo: {
                forwardingScore: 245,
                isForwarded: true,
                externalAdReply: {
                    title,
                    body,
                    description,
                    thumbnail: thumbnail || undefined,
                    thumbnailUrl: link || undefined,
                    renderLargerThumbnail: largerThumbnail,
                    sourceUrl: link || undefined,
                    showAdAttribution: adTag,
                    mediaType: 1,
                }
            }
        })
    }

    /**
     * @typedef {Object} SendButtonOptions
     * @property {string} [name]
     * @property {string} [surname]
     * @property {string} [text]
     * @property {string|Buffer} [image]
     * @property {{ text: string, id: string }[]} buttons
     * @property {import("baileys").proto.IWebMessageInfo} [quoted]
     * @property {boolean} [ai=false]
     */

    /**
     * Envia Botões No Formato Antigo
     * @param {string} jid
     * @param {SendButtonOptions} opts
     */
    client.sendButton = async (jid, opts) => {
        const {
            name = "",
                surname = "",
                text = "",
                image,
                buttons = [],
                quoted,
                ai = false
        } = opts;

        const jpegThumbnail = image ? await reSize(image, 300) : undefined;

        const isGroup = jid.endsWith("@g.us");

        const contextInfo = quoted ? {
            stanzaId: quoted.key.id,
            participant: quoted.key.participant || quoted.key.remoteJid,
            quotedMessage: quoted.message
        } : undefined;

        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                    },
                    buttonsMessage: proto.Message.ButtonsMessage.create({
                        locationMessage: {
                            name,
                            address: surname,
                            ...(jpegThumbnail ? {
                                jpegThumbnail
                            } : {})
                        },
                        contentText: text,
                        footerText: surname,
                        headerType: 6,
                        ...(contextInfo ? {
                            contextInfo
                        } : {}),
                        buttons: buttons.slice(0, 3).map((b) => ({
                            buttonId: b.id,
                            buttonText: {
                                displayText: b.text,
                            },
                            type: 1,
                        }))
                    })
                }
            }
        }, {
            userJid: client.user?.id
        });

        await client.relayMessage(msg.key.remoteJid, msg.message, {
                messageId: msg.key.id,
                additionalNodes: [{
                        tag: "biz",
                        attrs: {},
                        content: [{
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1"
                            },
                            content: [{
                                tag: "native_flow",
                                attrs: {
                                    v: "9",
                                    name: "mixed"
                                }
                            }]
                        }]
                    }, ...(ai && !isGroup ?
                        [
                            {
                                tag: "bot",
                                attrs: {
                                    biz_bot: "1"
                                }
                            }
                        ] : []
                    )
                ]
        });
    };

    return client;
}
