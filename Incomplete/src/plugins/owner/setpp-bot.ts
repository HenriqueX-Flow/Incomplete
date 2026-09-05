import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { log } from "@utils/logger.js";
import { S_WHATSAPP_NET } from "baileys";

async function generate(media: Buffer) {
    const Jimp = (await import("jimp")).default;
    const jimp = await Jimp.read(media);

    const min = Math.min(jimp.getWidth(), jimp.getHeight());
    const cropped = jimp.crop(0, 0, min, min);

    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG),
    };
}

const handler: CommandHandler = async (m: Util) => {
    if (!(await m.onlyImage())) {
        return await m.reply("italic", "Marque Uma Imagem Para Definir Como Foto Do Bot.");
    }

    const buffer = await m.downloadMedia();
    //@ts-ignore
    const { img } = await generate(buffer);

    try {
        await m.flow.query({
            tag: "iq",
            attrs: {
                to: S_WHATSAPP_NET,
                type: "set",
                xmlns: "w:profile:picture",
            },
            content: [
                {
                    tag: "picture",
                    attrs: {
                        type: "image",
                    },
                    content: img,
                },
            ],
        });

        await m.reply("italic", "Foto De Perfil Do Bot Atualizada Com Sucesso.");
    } catch (err) {
        log.error("Erro Ao Atualizar Foto:" + err);
        try {
            await m.flow.updateProfilePicture(m.flow.user?.id!, img);

            await m.reply("italic", "Foto De Perfil Atualizada (Modo Alternativo).");
        } catch (e2) {
            await m.reply("bold", "Falha Ao Atualizar A Foto De Perfil.");
        }
    }
};

handler.command = "setpp";
handler.help = ["setpp"];
handler.tags = ["owner"];
handler.desc = "+ (imagem)";
handler.owner = true;

export { handler };
