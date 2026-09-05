import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");

    if (!text) {
        return m.reply("italic", "Coloque Um Novo Nome.");
    }

    await m.flow.groupUpdateSubject(m.chat, text).catch((e) => m.reply("italic", "Ocorreu Um Erro."));
};

handler.command = ["setname"]
handler.help = ["setname"];
handler.tags = ["group"];
handler.desc = "+ (name)";
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export { handler };

