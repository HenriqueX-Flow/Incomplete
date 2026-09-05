import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");

    if (!text) {
        return await m.reply("strike", "Coloque Um Texto Após O Comando.");
    }

    await m.flow.updateProfileStatus(text);
    await m.reply("italic", "Bio Do Bot Trocada Para: " + text);
}

handler.command = "setbio";
handler.help = ["setbio"];
handler.tags = ["owner"];
handler.desc = "+ (texto)";
handler.owner = true;

export { handler };
