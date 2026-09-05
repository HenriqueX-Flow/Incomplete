import { Util } from "@core/context.js";
import { isPremium, readConfig } from "@utils/data-manager.js";

export function buildMenuText(m: Util): string {
    const botCfg = readConfig();

    const userName = m.raw.pushName || "Usuário Desconhecido";
    const userMention = `@${m.sender.split("@")[0]}`;
    const premium = isPremium(m.sender) ? "Sim" : "Não";

    const now = new Date();
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const today = days[now.getDay()];
    const date = now.toLocaleDateString("pt-BR");
    const hour = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    return `╭──❍「 *USER INFO* 」❍
│ *Nome:* ${userName}
│ *Tag:* ${userMention}
│ *Premium:* ${premium}
╰─┬────❍
╭─┴─❍「 *BOT INFO* 」❍
│ *Nome:* Incomplete
│ *Prefixo:* ${botCfg.prefix}
╰─┬────❍
╭─┴─❍「 *ABOUT* 」❍
│ *Hora:* ${hour}
│ *Dia:* ${today}
│ *Data:* ${date}
╰──────❍`;
}
