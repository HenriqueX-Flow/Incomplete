import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { readConfig } from "@utils/data-manager.js";

const handler: CommandHandler = async (m: Util, {
    pm
}) => {
    const botCfg = readConfig();
    const menu = pm?.buildMenu(botCfg.prefix, "Incomplete", "HenriqueX", "group");

    await m.reply(menu);
}

handler.command = "menu-grupo";
handler.help = ["menu-grupo"];
handler.tags = ["main"];

export { handler };
