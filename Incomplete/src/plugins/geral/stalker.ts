import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import parsePhoneNumberFromString from "libphonenumber-js";

const handler: CommandHandler = async (m: Util) => {
	const text = m.text?.trim() || "";
    const args = text.split(/\s+/).slice(1);

    let number = m.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.raw.message?.extendedTextMessage?.contextInfo?.participant || args[0];

    if (!number) {
        return await m.reply("italic", "Não Há Usuário Para Verificar, Coleque O Número Ou Marque O Alvo.");
    }

    number = number.replace(/\D/g, "") + "@s.whatsapp.net";

    const result = await m.flow?.onWhatsApp(number).catch(() => []);
    const contact = result?.[0];
    const exists = contact?.exists ?? false;

    if (!exists) {
        await m.reply("O Usu. Não Existe No WhatsApp.");
    }

    const img = await m.flow.profilePictureUrl(number, "image").catch(() => null);
    const business = await m.flow?.getBusinessProfile(number).catch(() => null);
    const rawNumber = number.split("@")[0];
    const phone = parsePhoneNumberFromString("+" + rawNumber);
    const country = phone?.country || "*";
    const formatted = phone?.formatInternational() || "+" + rawNumber;

    let waMessage = `*WhatsApp*
- Nome: @${rawNumber}
- País: ${country}
- Formato Número: ${formatted}
- Url: wa.me/${rawNumber}

${business ? `*WhatsApp Business*
- BusinessId: ${business.wid}
- WebSite: ${business.website || "*"}
- Categoria: ${business.category || "*"}
- Fuso Horário: ${business.business_hours?.timezone || "*"}
- Descrição: ${business.description || "*"}
- Endereço: ${business.address || "*"}` : ""}`;

    if (img) {
        await m.sendButton(m.chat, {
            media: { image: { url: img } },
            caption: waMessage,
            mentions: [number],
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Chat",
                        url: `https://wa.me/${rawNumber}`
                    })
                }
            ]
        })
    } else {
        await m.reply(waMessage, {
            mentions: [number]
        })
    }
}

handler.command = "stalk";
handler.help = ["stalk"];
handler.tags = ["geral"];
handler.desc = "+ (número)";

export { handler };
