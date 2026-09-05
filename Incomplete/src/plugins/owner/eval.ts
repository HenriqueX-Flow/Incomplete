import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");

    if (!text || text.length === 0) {
        return await m.reply("strike", "Coloque O Código Após O Comando.");
    }

    try {
        let code = text;
        let result = await eval(code);
        if (typeof result !== "string")
            result = JSON.stringify(result, null, 2);
        if (result.length > 4000) {
            await m.reply("italic", "Resultado Muito Grande, Enviando No JSON.");
            setTimeout(async () => {
                await m.reply("mono", "Análise Via Arquivo JSON", {
                    document: Buffer.from(result),
                    fileName: "eval.json",
                    mimetype: "application/json",
                });
            }, 7000);
        } else {
            await m.reply("mono", result);
        }
    } catch (e) {
        await m.reply("mono", `Erro: ${e}`);
    }
}

handler.command = "eval";
handler.help = ["eval"];
handler.tags = ["owner"];
handler.desc = "+ (código)";
handler.owner = true;

export { handler };
