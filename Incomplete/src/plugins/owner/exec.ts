import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import cp from "child_process";
import { promisify } from "util";

const exec = promisify(cp.exec).bind(cp);

const handler: CommandHandler = async (m: Util, { 
    args 
}) => {
    const text = args?.join(" ");

    if (!text || text.length === 0)
        return m.reply("mono", "Olá Dev, Coloque O Comando.");

    let o;
    try {  
        o = await exec(text, { timeout: 5000, maxBuffer: 1024 * 1024 });
    } catch (e: any) {
        o = e;
    } finally {
        const stdout = o.stdout ? o.stdout.toString().trim() : "";
        const stderr = o.stderr ? o.stderr.toString().trim() : "";

        if (stdout) {
            await m.reply("mono", `SAÍDA:\n${stdout.slice(0, 4000)}`)
        } else if (stderr) {
            await m.reply("mono", `ERRO:\n${stderr.slice(0, 4000)}`);
        }
    }
};

handler.command = ["exec"]
handler.help = ["exec"];
handler.tags = ["owner"];
handler.desc = "+ (comando)";
handler.owner = true;

export { handler };
