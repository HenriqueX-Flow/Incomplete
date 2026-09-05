import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

const handler: CommandHandler = async (m: Util, { 
    cfg 
}) => {
    const args = (m.text || "").trim().split(/\s+/).slice(1);
    const input = (args[0] || "").toLowerCase();

    const map: Record<string, "all" | "none" | "contacts" | "contact_blacklist"> = {
        todos: "all",
        all: "all",

        ninguém: "none",
        nenhum: "none",
        none: "none",

        contatos: "contacts",
        contacts: "contacts",

        bloqueados: "contact_blacklist",
        blacklist: "contact_blacklist",
    };

    const value = map[input];

    if (!value) {
        return await m.reply("quote", `Valor Inválido. Use Um Dos Exemplos: \n• ${cfg!.prefix}up-pp-bot todos \n• ${cfg!.prefix}up-pp-bot contatos \n• ${cfg!.prefix}up-pp-bot ninguém \n• ${cfg!.prefix}up-pp-bot bloqueados`);
    }

    await m.reply("bold", "Aguarde Um Pouco…");
    await sleep(9500);  

    await m.flow.updateProfilePicturePrivacy(value);
    await sleep(5200);

    return await m.reply("quote", `Privacidade Da Foto De Perfil Atualizada Com Sucesso. Valor Aplicado: *${value}*`);
};

handler.command = ["up-pp-bot", "up-profile-picture"];
handler.help = ["up-pp-bot"];
handler.tags = ["owner"];
handler.desc = "+ (valor)";
handler.owner = true;

export { handler };
