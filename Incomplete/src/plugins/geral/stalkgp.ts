import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util) => {
    const isGroup = m.chat.endsWith("@g.us");
  
    if (!isGroup) {
        return await m.reply("italic", "O Comando Deve Ser Usado Em Um Grupo.");
    }
  
    const metadata = await m.flow.groupMetadata(m.chat);
    const subject = metadata.subject || "*";
    const desc = metadata.desc?.toString() || "*";
    const owner = metadata.owner || "Desconhecido";
    const participants = (metadata.participants || []).length;

    let ppGroupUrl: any;
    try {
        ppGroupUrl = await m.flow.profilePictureUrl(m.chat, "image");
    } catch (e) {
        ppGroupUrl = null;
    }

    const caption = [
        `- Grupo: ${subject}`,
        `- Descrição: ${desc}`,
        `- Dono: @${owner.split("@")[0]}`,
        `- Participantes: ${participants}`,
        `- ID: ${m.chat}`,
        `- Link: ${metadata.inviteCode?.toString() || "*"}`
    ].join("\n");

    if (ppGroupUrl) {
        const res = await fetch(ppGroupUrl);
        await m.flow.sendMessage(m.chat, {
            image: res,
            caption,
            mentions: [owner]
        })
    } else {
        await m.reply(caption, { mentions: [owner] });
    }
}

handler.command = ["stalkgp", "stalk-gp"];
handler.help = ["stalk-gp"];
handler.tags = ["geral"];

export { handler };
