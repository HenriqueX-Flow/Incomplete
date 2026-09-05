import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import fs from "fs";

const handler: CommandHandler = async (m: Util, { pm, cfg }) => {
    const menu = pm!.buildMenu(cfg!.prefix);
    await m.reply(menu, {
        document: fs.readFileSync("./assets/image/resized.jpg"),
        fileName: "Incomplete Bot",
        fileLength: 245000000,
        mimetype: "image/jpeg",
        jpegThumbnail: fs.readFileSync("./assets/image/resized.jpg"),
        contextInfo: {
            isForwarded: true,
            externalAdReply: {
                title: "@Incomplete",
                body: "• Powered By HenriqueX",
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/55tni9.png",
                renderLargerThumbnail: true,
            }
        }
    })
}

handler.command = ["menu-completo", "all-menu"];
handler.help = ["menu-completo"];
handler.tags = ["main"];

export {
	handler
};
