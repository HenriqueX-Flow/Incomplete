import fs from "fs";
import { Util } from "@core/context.js";
import { PluginManager } from "@utils/plugin-manager.js";
import { readConfig } from "@utils/data-manager.js";
import { buildMenuText } from "./buildMenuText.js";

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function renderMenuDocument(m: Util) {
    const botCfg = readConfig();
    const pm = new PluginManager();
    const menuText = buildMenuText(m) + "\n\n";
    await pm.loadAll();
    const menu = pm.buildMenu(botCfg.prefix, "Incomplete", "HenriqueX");

    const content: any = {
        document: fs.readFileSync("./assets/image/resized.jpg"),
		fileName: "Incomplete",
		fileLength: 245000000,
		pageCount: 245,
		mimetype: "image/jpeg",
		jpegThumbnail: fs.readFileSync("./assets/image/resized.jpg"),
        caption: menuText + menu,
        contextInfo: {
            isForwarded: true,
            mentionedJid: [m.sender, botCfg.owner],
            externalAdReply: {
                title: "@Incomplete",
                body: "Powered By HenriqueX",
                thumbnailUrl: botCfg.image,
                mediaType: 1,
                priviewType: 0,
                renderLargerThumbnail: true
            }
        }
    };

    await sleep(1800);
    await m.flow.sendMessage(m.chat, {
        react: { text: "👍", key: m.raw.key }
    });

    await sleep(2000);
    await m.flow.sendMessage(m.chat, content, { quoted: {
        key: {
            fromMe: false,
            participant: m.sender,
            remoteJid: m.chat,
        },
        message: {
            extendedTextMessage: {
                text: "Incomplete 💀"
            }
        },
    }});
}
