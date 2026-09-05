import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { isAbsolute } from "node:path";

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");
    if (!text || text.length === 0)
        return m.reply("italic", "Coloque A Opção Exemplo !grupo abrir/!grupo fechar.");

    if (text === "fechar") {
        await m.flow.groupSettingUpdate(m.chat, "announcement")
    } else if (text === "abrir") {
        await m.flow.groupSettingUpdate(m.chat, "not_announcement")
    } else {
        await m.reply("Exemplo: !grupo abrir/!grupo fechar")
    }
};

handler.command = ["grupo"]
handler.help = ["grupo"];
handler.tags = ["group"];
handler.desc = "+ (opção)";
handler.group = true;
handler.botAdmin = true;
handler.admin = true;

export { handler };

