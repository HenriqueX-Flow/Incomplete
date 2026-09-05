import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util) => {
    await m.reply("bold", "Pong...");
}

handler.command = "ping";
handler.help = ["ping"];
handler.tags = ["geral"];

export { handler };
