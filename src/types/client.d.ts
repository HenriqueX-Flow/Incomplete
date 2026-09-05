/**
 * Tipo Estendido Do Socket Do Baileys: O `attachMethods()` (Em client.js)
 * Adiciona Vários Métodos Utilitários Ao Socket Criado Pelo `makeWASocket()`.
 * Este Arquivo Declara Essas Propriedades Extras Pra Que O `checkJs` Do
 * jsconfig.json (E O Autocomplete Do Editor) Conheçam Elas Sem Reclamar.
 */

import type { WASocket, proto, AnyMessageContent, GroupParticipant } from "baileys";

/**
 * Opções Do `sendInteractive()` — Veja A Documentação Em client.js.
 */
export interface SendInteractiveOptions {
    text?: string;
    footer?: string;
    title?: string;
    subtitle?: string;
    ai?: boolean;
    buttons: MixedButton[];
    mentions?: string[];
    quoted?: proto.IWebMessageInfo;
    media?: AnyMessageContent;
    messageJson?: Record<string, unknown>;
}

/**
 * Botão Do Formato Misto (Quick Reply / Link / Lista / Catálogo).
 */
export interface MixedButton {
    name: string;
    buttonParamsJson: string;
}

/**
 * Opções Do `sendButton()` — Veja A Documentação Em client.js.
 */
export interface SendButtonOptions {
    name?: string;
    surname?: string;
    text?: string;
    image?: string | Buffer;
    buttons: { text: string; id: string }[];
    quoted?: proto.IWebMessageInfo;
    ai?: boolean;
}

/**
 * Opções Do `sendLinkCard()` — Veja A Documentação Em client.js.
 */
export interface LinkCardOptions {
    text?: string;
    title?: string;
    body?: string;
    description?: string;
    largerThumbnail?: boolean;
    thumbnail?: string | Buffer;
    thumbnailUrl?: string;
    sourceUrl?: string;
    adTag?: boolean;
}

/**
 * Opções Do `sendRichHtml()` — Veja A Documentação Em client.js.
 */
export interface SendRichHtmlOptions {
    id: string;
    title: string;
    html: string;
    source?: string;
}

/**
 * O Socket Do Baileys Já Com Todos Os Métodos Que `attachMethods()`
 * Adiciona Por Cima Dele.
 */
export interface ExtendedWASocket extends WASocket {
    wasSentByBot: (id: string) => boolean;
    reply: (jid: string, text: string) => Promise<unknown>;
    decodeJid: (jid: string) => string;
    getName: (jid: string) => Promise<string>;
    getAdmin: (groupJid: string, userJid: string) => Promise<boolean>;
    getJidFromParticipants: (groupJid: string, userJid: string) => Promise<GroupParticipant | null>;
    profilePicture: (jid: string, timeoutMs?: number) => Promise<string | null>;
    sendInteractive: (jid: string, opts: SendInteractiveOptions) => Promise<unknown>;
    hasMedia: (raw: proto.IWebMessageInfo) => "image" | "video" | "audio" | "sticker" | "document" | null;
    downloadMedia: (raw: proto.IWebMessageInfo) => Promise<Buffer | null>;
    sendLinkCard: (jid: string, opts: LinkCardOptions) => Promise<unknown>;
    sendButton: (jid: string, opts: SendButtonOptions) => Promise<unknown>;
    sendRichHtml: (jid: string, opts: SendRichHtmlOptions) => Promise<unknown>;
}
