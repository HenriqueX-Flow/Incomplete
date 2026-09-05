import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util, {
	args
}) => {
    const chat = m.chat;
	const sender = m.sender;
	const botJid = m.flow.user?.id || "Não Encotrado";
	const botLid = m.flow.user?.lid || "Não Encotrado";

	const text = `* ID Do Chat Atual: ${chat}\n* ID Do Usuário: ${sender}\n\n* ID Do Bot: ${botJid}\n* Lid Do Bot: ${botLid}`
	await m.sendButton(m.chat, {
		text: text,
		footer: "HenriqueX",
		quoted: m.raw,
		buttons: [{
			name: "cta_copy",
			buttonParamsJson: JSON.stringify({
				display_text: "Copiar Seu ID",
				id: sender,
				copy_code: sender
			})
		}]
	})
}

handler.command = "getid";
handler.help = ["getid"];
handler.tags = ["geral"];

export {
	handler
};
