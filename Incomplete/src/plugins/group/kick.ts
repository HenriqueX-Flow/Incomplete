import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util) => {
    const jidMentioned = m.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const jidReply = m.raw.message?.extendedTextMessage?.contextInfo?.participant

    try {
        if (!jidMentioned || jidMentioned.length === 0) {
            if (!jidReply) {
                return await m.reply("Marque O Usuario.")
            }

            await m.flow.groupParticipantsUpdate(m.chat, [jidReply], "remove");
        }

        //@ts-ignore
        await m.flow.groupParticipantsUpdate(m.chat, Array.isArray(jidMentioned) ? jidMentioned : [jidMentioned], "remove")
    } catch (e) {
        console.log(e);
    }
}

handler.command = ["kick", "ban"];
handler.help = ["ban"];
handler.tags = ["group"];
handler.desc = "+ (@tag)";
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export { handler };

