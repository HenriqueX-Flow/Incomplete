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

            await m.flow.groupParticipantsUpdate(m.chat, [jidReply], "promote");
            await m.reply("italic","Usuario Promovido")
        }

        //@ts-ignore
        await m.flow.groupParticipantsUpdate(m.chat, Array.isArray(jidMentioned) ? jidMentioned : [jidMentioned], "promote")
        await m.reply("bold", "Usuario Promovido")
    } catch (e) {
        console.log(e);
    }
}

handler.command = ["promote", "promover"];
handler.help = ["promote"];
handler.tags = ["group"];
handler.desc = "+ (@tag)";
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export { handler };

