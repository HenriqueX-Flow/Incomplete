import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");

    if (!text) {
        return m.reply("italic", "Coloque Uma Nova Descrição.");
    }

    await m.flow.groupUpdateDescription(m.chat, text).catch((e) => m.reply("italic", "Ocorreu Um Erro."));
};

handler.command = ["setdesc"]
handler.help = ["setdesc"];
handler.tags = ["group"];
handler.desc = "+ (text)";
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export { handler };

