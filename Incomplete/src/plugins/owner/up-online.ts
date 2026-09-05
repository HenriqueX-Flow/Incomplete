import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

const handler: CommandHandler = async (m: Util, { 
    cfg 
}) => {
    const args = (m.text || "").trim().split(/\s+/).slice(1);
    const input = (args[0] || "").toLowerCase();

    const map: Record<string, "all" | "contacts" | "contact_blacklist"> = {
        todos: "all",
        all: "all",

        contatos: "contacts",
        contacts: "contacts",

        bloqueados: "contact_blacklist",
        blacklist: "contact_blacklist",
    };

    const value = map[input];

    if (!value) {
        return await m.reply("quote", `Valor Inválido. Use Um Dos Exemplos: \n• ${cfg!.prefix}up-add-gp todos \n• ${cfg!.prefix}up-add-gp contatos \n• ${cfg!.prefix}up-add-gp bloqueados`);
    }

    await m.reply("bold", "Aguarde Um Pouco…");

    await sleep(9500);
    await m.flow.updateGroupsAddPrivacy(value);
    await sleep(5200);

    return await m.reply("quote", `Privacidade De Quem Pode Adicionar O Bot Em Grupo Atualizada Com Sucesso. Valor Aplicado: *${value}*`);
};

handler.command = ["up-add-gp"];
handler.help = ["up-add-gp"];
handler.tags = ["owner"];
handler.desc = "+ (valor)";
handler.owner = true;

export { handler };
