import { log } from "@utils/logger.js";
import {
	getContentType,
    jidNormalizedUser,
	proto,
	WASocket,
	AnyMessageContent,
	generateWAMessageContent,
	generateWAMessageFromContent,
	WAMessage,
	downloadMediaMessage
} from "baileys";

type StyleType = "bold" | "italic" | "strike" | "mono" | "quote";

interface MixedButton {
    name: string;
    buttonParamsJson: Record <string, any> | string;
}

interface SendInteractiveOptions {
	text?: string;
    caption?: string;
	footer?: string;
	title ?: string;
	subtitle?: string;
	ai?: boolean;
	contextInfo?: proto.IContextInfo;
    messageJson?: Record <string, any> | string;
	buttons: MixedButton[];
	mentions?: string[];
	quoted?: proto.IWebMessageInfo;
	media?: AnyMessageContent;
}

class Util {
	flow: WASocket;
    raw: proto.IWebMessageInfo;
	message?: any;

	constructor(flow: WASocket, raw: proto.IWebMessageInfo) {
		this.flow = flow;
		this.raw = raw;
		this.message = raw.message;
	}

	get sender(): string {
		return jidNormalizedUser((this.raw.key as any).participant || (this.raw.key as any).remoteJid) as string;
	}

	get chat(): string {
		return (this.raw.key as any).remoteJid as string
	}

	get text(): string {
		try {
			const msg = this.raw.message;
			if (!msg)
				return "";

			const type = getContentType(msg);
			switch (type) {
				case "conversation":
					return msg.conversation || "";
				case "extendedTextMessage":
					return (msg.extendedTextMessage?.text || msg.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || "");
				case "imageMessage":
					return msg.imageMessage?.caption || "";
				case "videoMessage":
					return msg.videoMessage?.caption || "";
				case "interactiveResponseMessage":
					const isId = msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : "";
					return isId;
				case "buttonsResponseMessage":
					return msg.buttonsResponseMessage?.selectedButtonId || "";
                case "templateButtonReplyMessage":
                    return msg.templateButtonReplyMessage?.selectedId || ""
                default:
					return "";
			}
		} catch {
			return "";
		}
	}

	async onlyMedia(): Promise <boolean> {
		return (
			!!this.raw.message?.imageMessage ||
			!!this.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
			!!this.raw.message?.videoMessage ||
			!!this.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage
		)
	}

    async onlyImage(): Promise<boolean> {
        return (   
            !!this.raw.message?.imageMessage ||
            !!this.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        )
    } 
	async reply(
		textOrStyle?: string | null,
		text?: string | null | Record <string, any>,
		opts: Record <string, any> = {}
	) {
		const styles: StyleType[] = ["bold", "italic", "strike", "mono", "quote"];

		let style: StyleType | null = null;
		if (textOrStyle && styles.includes(textOrStyle as StyleType)) {
			style = textOrStyle as StyleType;
		}

		if (typeof text === "object" && text !== null) {
			opts = text;
			text = null;
		}

		let finalText = style ? text || "" : textOrStyle || "";

		if (style) {
			switch (style) {
				case "bold":
					finalText = `*${finalText}*`;
					break;
				case "italic":
					finalText = `_${finalText}_`;
					break;
				case "strike":
					finalText = `~${finalText}~`;
					break;
				case "mono":
					finalText = `\`\`\`${finalText}\`\`\``;
					break;
				case "quote":
					finalText = `> ${finalText}`;
					break;
			}
		}

		const hasMedia = ["image", "video", "audio", "sticker", "document"].some((k) => k in opts);
		const messagePayload = (hasMedia ?
			{
				...opts,
				caption: finalText
			} : {
				text: finalText,
				...opts
			}) as AnyMessageContent;

        return this.flow.sendMessage(this.chat, messagePayload, {
			quoted: {
				key: {
					fromMe: false,
					participant: this.sender,
					remoteJid: this.chat,
				},
				message: {
					extendedTextMessage: {
						text: "Incomplete 💀"
					}
				},
			},
		});
	}

  async sendButton(jid: string, content: SendInteractiveOptions) {
        const {
			text,
            caption,
			footer = "",
			title,
			subtitle,
			ai,
			contextInfo = {},
			buttons,
      messageJson,
			mentions = [],
			quoted,
			media,
		} = content;
 
        const nativeFlow: any = {
            buttons: buttons.map(a => ({
                name: a.name,
                buttonParamsJson: JSON.stringify(a.buttonParamsJson ? typeof a.buttonParamsJson === "string" ? JSON.parse(a.buttonParamsJson) : a.buttonParamsJson : {})
            }))
        };

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
							text: text || caption || ""
						}),
						footer: proto.Message.InteractiveMessage.Footer.create({
							text: footer
						}),
						header: proto.Message.InteractiveMessage.Header.create({
							title,
							subtitle,
							hasMediaAttachment: !!media,
							//@ts-ignore
							...(media ? await generateWAMessageContent(media, {
								upload: this.flow.waUploadToServer
							}) : {})
						}),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create(nativeFlow),
                        contextInfo: {
                            ...contextInfo,
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
			userJid: this.flow.user?.id!
		});

        const isGroup = jid.endsWith("@g.us");
		const showAI = ai !== undefined ? ai : !isGroup;

		return await this.flow.relayMessage(msg.key.remoteJid!, msg.message!, {
            messageId: msg.key.id!,
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
                        },
                    }],
                }]
            }, ...(showAI ?
                    [{
                        tag: "bot",
                        attrs: {
                            biz_bot: "1"
                        },
                    }] :
                    []),
            ]
        })
    }
 
    async downloadMedia(): Promise <Buffer | null> {
        try {
			let target: any = this.raw;
			const quoted = this.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;

			if (quoted?.imageMessage || quoted?.videoMessage || quoted?.audioMessage) {
				target = {
					key: {
						...this.raw.key,
						id: this.raw.message?.extendedTextMessage?.contextInfo?.stanzaId
					},
					message: quoted
				}	as WAMessage;
			}

			const buffer = await downloadMediaMessage(target, "buffer", {});
			return buffer as Buffer;
		} catch (e) {
			log.error(`Não Conseguir Baixar A Mídia: ${e}`);
			return null;
		}
	}
}

export {
	Util
};
