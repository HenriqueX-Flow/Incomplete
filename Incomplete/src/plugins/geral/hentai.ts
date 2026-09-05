import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import axios from "axios";
import * as cheerio from "cheerio";

interface HentaiItem {
    title: string;
    link: any;
    video_1: string
}

async function hentai(): Promise<HentaiItem[]> {
    const page = Math.floor(Math.random() * 1153);
    try {
        const { data } = await axios.get("https://sfmcompile.club/page/" + page);
        const $ = cheerio.load(data);
        const result: HentaiItem[] = [];

        $("#primary > div > div > ul > li > article").each((_, b) => {
            result.push({    
                title: $(b).find("header > h2").text().trim(),
                link: $(b).find("header > h2 > a").attr("href"),
                video_1: $(b).find("source").attr("src") || ""
            });
        });

        return result;
    } catch (err) {
        console.error("Erro Ao Buscar Hentai:", err);
        return [];
    }
}

const handler: CommandHandler = async (m: Util ) => {
    let results = await hentai();
    if (results.length === 0) {
        return await m.reply("Nenhum Resultado Encontrado 👍");
    }

    let item = results[Math.floor(Math.random() * results.length)];

    await m.sendButton(m.chat, { 
        media: {
            video: { url: item.video_1 }
        },
        caption: `Título 👉 ${item.title}`,
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Ver Na Web",
                    url: item.link
                })
            }
        ],
        quoted: m.raw
    });
}

handler.command = "hentai";
handler.tags = ["geral"];
handler.help = ["hentai"];

export { handler };
