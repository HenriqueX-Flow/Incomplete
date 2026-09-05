import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { readConfig } from "@utils/data-manager.js";

const handler: CommandHandler = async (m: Util, {
    pm
}) => {
    const botCfg = readConfig();
   
	const menu = pm?.buildMenu(botCfg.prefix, "Incomplete", "HenriqueX", "owner");

	await m.reply(menu);
}

handler.command = "menu-owner";
handler.help = ["menu-owner"];
handler.tags = ["main"];

export { handler };
