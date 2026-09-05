import { Util } from "@core/context.js";
import { readConfig } from "@utils/data-manager.js";
import { buildMenuText } from "./buildMenuText.js";
import { PluginManager } from "@utils/plugin-manager.js";

export async function renderMenuSimple(m: Util) {
    const botCfg = readConfig();
    const pm = new PluginManager();
    const menuText = buildMenuText(m) + "\n\n";
    await pm.loadAll();
    const menu = pm.buildMenu(botCfg.prefix);

    await m.flow?.sendMessage(m.chat, {
        image: { url: botCfg.image },
        caption: menuText + menu,
        mentions: [m.sender, botCfg.owner],
    });
}
