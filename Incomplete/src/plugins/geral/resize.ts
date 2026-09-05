import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import Jimp from "jimp";
import fs from "fs";
import path from "path";

const handler: CommandHandler = async (m: Util) => {
    try {
        if (!m.onlyImage()) {
            return await m.reply("bold", "Marque Uma Imagem Com O Comando '!resize'.");
        }

        await m.reply("italic", "Redimensionando Imagem... Aguarde.");
 
        const tmpDir = path.join(process.cwd(), ".cache", "temp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const media = await m.downloadMedia();
        if (!media) return await m.reply("bold", "Erro Ao Baixar A Imagem.");

        const image = await Jimp.read(media);
        const fileName = `resize_${Date.now()}.png`;
        const filePath = path.join(tmpDir, fileName);

        await image.cover(300, 300).quality(90).writeAsync(filePath);

        await m.reply("bold", "Imagem Redimensionada Para 300x300", {
            image: fs.readFileSync(filePath),
            caption: "Aqui Está Sua Imagem 300x300.",
            mimetype: "image/png"
        });

    } catch (e) {
        console.error(e);
        await m.reply("mono", `Erro Ao Processar`);
    }
}

handler.command = "resize";
handler.help = ["resize"];
handler.tags = ["geral"];
handler.desc = "+ (imagem)";

export { handler };