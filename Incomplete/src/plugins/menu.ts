import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { isPremium, readConfig } from "@utils/data-manager.js";
import { exec } from "child_process";
import { getMenuType, setMenuType } from "@utils/data-manager.js";
import { renderMenuSimple } from "./types_menus/renderMenuSimple.js";
import { renderMenuDocument } from "./types_menus/renderMenuDocument.js";
import { renderMenuFlow } from "./types_menus/renderMenuFlow.js";

const handler: CommandHandler = async (m: Util, {
    cfg
}) => {
    const args = m.text?.trim() || "";
    const text = args.split(/\s+/).slice(1);
  
    if (text[0] === "set") {
        if (m.sender !== cfg!.owner) 
            return m.reply("Apenas O Dono Pode Mudar O Estilo.");

        const type = Number(text[1]);
        if (![1, 2, 3].includes(type)) {
            return m.reply("italic", "Menu Inválido. Escolhe 1, 2 Ou 3.");
        }
 
        setMenuType(type);
        return m.reply("quote", `Modelo De Menu Alterado. Agora O Bot Usa O Tipo: *${type}*.`);
    }

    const menuType = getMenuType();

    switch (menuType) {
        case 1:
            return renderMenuSimple(m);
        case 2:
            return renderMenuDocument(m);
        case 3:
        default:
            return renderMenuFlow(m);
    }
};

handler.command = ["menu", "main", "help"]
handler.help = ["menu"];
handler.tags = ["main"];

export {
    handler
};
