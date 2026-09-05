import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";

const handler: CommandHandler = async (m: Util) => {
    await m.flow.sendMessage("status@broadcast", {
        text: "Fazendo Um Teste",
    }, {
            broadcast: true,
            statusJidList: ["558888205721@s.whatsapp.net"]        
        }
    )
}

handler.command = "up-to-status";
handler.help = ["up-to-status"];
handler.tags = ["owner"]
handler.owner = true;

export { handler };
