import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";
import { FormData, File } from "formdata-node";
import fetch from "node-fetch";

async function catbox(content: Buffer) {
    const { ext = "bin", mime = "application/octet-stream" } = (await fileTypeFromBuffer(content)) || {};

    const randomBytes = crypto.randomBytes(5).toString("hex");
    const file = new File([content], `${randomBytes}.${ext}`, { type: mime });

    const formData: any = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", file);

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86 64) AppleWebKit/537.36 (KHTML, Like, Gecko) Chrome/44.0.2403.157 Safari/537.36"
        }
    });

    return await response.text();
}

const handler: CommandHandler = async (m: Util) => {
    if (!(await m.onlyMedia())) {
        return await m.reply("strike", "Marque Uma Mídia 'Imagem Ou Vídeo'");
    }

    const buffer = await m.downloadMedia();
    //@ts-ignore
    const url = await catbox(buffer);

    await m.reply("italic", "Fazendo Upload...");

    setTimeout(async () => {
        await m.sendButton(m.chat, {
            media: {
                image: { url: url }
            },
            caption: `Olà, ${m.raw.pushName || "Uasuário"}, Aqui O Resultado 👍`,
            buttons: [       
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Copiar Link",
                        id: url,
                        copy_code: url
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Ver Imagem",
                        url: url
                    })
                }
            ]
        })
    }, 8000);
}

handler.command = ["tourl", "tolink", "to-url", "to-link"];
handler.help = ["tourl"];
handler.tags = ["geral"];
handler.desc = "+ (mídia)";

export { handler };
