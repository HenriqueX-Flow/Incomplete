import { WAConnect } from "@core/connect.js";
import { readConfig } from "@utils/data-manager.js";
import { initTempSystem } from "@utils/functions.js";
import { PluginManager } from "@utils/plugin-manager.js";

const pm = new PluginManager();
const botCfg = readConfig();
const bot = new WAConnect(pm, botCfg);

await pm.loadAll();
await bot.start();
initTempSystem();