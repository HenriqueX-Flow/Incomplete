import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { Scraper } from "@utils/scraper.js";

const handler: CommandHandler = async (m: Util) => {
    const args = m.text?.trim() || "";
    const text = args.split(/\s+/).slice(1).join(" ")

    if (!text) {
        return await m.reply("italic", "Digite Seu Nome Após O Comando.");
    }

    const style = await Scraper.style(text);
    const list = style.map((e, i) => `*${i + 1}.* ${e.name}: ${e.result}`).join("\n");
    await m.reply(list);
}

handler.command = ["gerarnick", "gerar-nick"];
handler.help = ["gerar-nick"];
handler.tags = ["geral"];
handler.desc = "+ (nome)";

export { handler };
