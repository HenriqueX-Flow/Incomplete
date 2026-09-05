import { Util } from "@core/context.js";
import { log } from "@utils/logger.js";
import { sticker } from "@utils/sticker.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util) => {
    if (!(await m.onlyImage())) {
        return await m.reply("italic", "Marque Uma Imagem");
    }

    const buffer = await m.downloadMedia();
    if (!buffer) {
        return await m.reply("bold", "Ocorreu Um Erro Ao Baixar Mídia.");
    }

    try {
        const stk = await sticker(buffer, undefined, "By", `${m.raw.pushName || "ITP Bot"}`);
        await m.flow.sendMessage(m.chat, {
            sticker: stk,
        });
    } catch (e) {
        log.error(`Erro Ao Criar Figurinha: ${e}`);
        await m.reply("italic", "Não Conseguir Criar Sua Figurinha.");
    }
};

handler.command = ["sticker", "stk", "s", "f", "figurinha", "fig"];
handler.help = ["sticker"];
handler.tags = ["geral"];
handler.desc = "+ (imagem)";

export { handler };
