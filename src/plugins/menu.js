import fs from "fs";
import {
    listButton,
    quickReplyButton,
    urlButton,
    hiddenButton
} from "#whatsapp/buttons.js";
import {
    nowBR,
    fetchBufferWithTimeout,
    Utils
} from "#core/utils.js";
import { getLevelProgress } from "#utils/levelSystem.js";
import { isPremium } from "#core/premium.js";
import { read } from "#utils/path.js";

/**
 * Deixa A Primeira Letra Maiúscula.
 * @param {string} s
 */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** @type {import("../handler.js").PluginRun} */
export const run = {
    usage: ["menu", "help", "menuall"],
    category: "mixs",
    run: async (m, {
        db,
        client,
        config,
        command,
        plugins,
        menuCategory,
        setting
    }) => {
        const user = db.getUser(m.sender);
        const premium = isPremium(user);
        const { level } = getLevelProgress(user.xp || 0);
        const validity = premium && user.premiumUntil ? ` (Até ${new Date(user.premiumUntil).toLocaleString("pt-BR")})` : premium ? ` (Permanente)` : "";
        const system = db.data.system;
        
        const categories = [...new Set(plugins.map((p) => p.category))].sort();
        const listCommands = (category) => plugins.filter((p) => p.category === category).map((p) => `│ • *${config.prefix}${p.usage[0]}*`).join("\n");
        const userNameLabel = "Nome";
        const premiumLabel = "Premium";
        const limitLabel = "Limite";
        const levelLabel = "Nível";
        const balanceLabel = "Saldo";
        const modeLabel = {
            public: "Público",
            private: "Privado"
        };
        const mode = modeLabel[system.status] || "Desconhecido";

        const fullList = () => {
            let text = `╭──❍「 *USUÁRIO* 」❍\n├ *${userNameLabel}:* ${m.pushName}\n├ *Tag:* @${m.sender.split("@")[0]}\n├ *${premiumLabel}:* ${premium ? "Sim" + validity : "Não"}\n├ *${limitLabel}:* ${user.limit}\n├ *${levelLabel}:* ${level}\n├ *${balanceLabel}:* ${user.nc || 0} ${config.economy?.currencySymbol || "NC"}\n╰─┬────❍\n╭─┴─❍「 *BOT* 」❍\n├ *Nome Do Bot:* ${config.botName || "Incomplete-Bot"}\n├ *Plataforma:* @${'0@s.whatsapp.net'.split('@')[0]}\n├ *Dono:* @${config.owner[0].split('@')[0]}\n├ *Prefixo:* ${config.prefix}\n├ *Modo:* ${mode}\n╰──────❍\n\n`
            
            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                const isFirst = i === 0;
                const isLast = i === categories.length - 1;

                if (isFirst) {
                    text += `╭──❍「 *${category.toUpperCase()}* 」❍\n`;
                } else {
                    text += `╭─┴❍「 *${category.toUpperCase()}* 」❍\n`;
                }
                text += `${listCommands(category)}\n`;
                if (isLast) {
                    text += `╰──────❍\n`;
                } else {
                    text += `╰─┬────❍\n`;
                }
            }
            return text
        }

        if (menuCategory) {
            if (!categories.includes(menuCategory)) {
                return m.reply(`(X) Categoria "${menuCategory}" Não Encontrada.`);
            }
            return client.reply(m.chat, `╭──❍「 *${menuCategory.toUpperCase()}* 」❍\n${listCommands(menuCategory)}\n╰──────❍`);
        }

        if (setting.style === "1" || command === "menuall") {
            await client.sendLinkCard(m.chat, {
                text: fullList(),
                title: config.botName,
                body: `Menu Completo — ${categories.length} Categorias`,
                description: "Lista De Todos Os Comandos Do Bot",
                thumbnail: read("#media/image/thumb.png"),
                thumbnailUrl: config.preview,
                sourceUrl: config.preview,
                largerThumbnail: true,
                adTag: false
            });
        }

        if (setting.style === "2") {
            const categoryConfig = {
                bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    divider_indices: [1, 2, 3, 4],
                    list_title: "Categorias",
                    button_title: "Categorias"
                },
                tap_target_configuration: {
                    title: " X ",
                    description: "midex_buttons",
                    canonical_url: "https://example.com",
                    domain: "shop.example.com",
                    button_index: 0
                }
            };
            const rows = categories.map((category) => ({
                title: cap(category),
                description: `Ver Comandos Da Categoria ${cap(category)}.`,
                id: `${config.prefix}menu-${category}`
            }));

            return await client.sendInteractive(m.chat, {
                media: { image: read("#media/image/thumb.png") },
                text: `Menu Do Bot *${config.botName || ""}*\nUse ${config.prefix}menu-<categoria> Ou Escolha Abaixo:`,
                footer: config.botName,
                quoted: m.raw,
                messageJson: categoryConfig,
                buttons: [hiddenButton(),
                listButton("Categorias", [{
                    title: "Categorias",
                    rows
                }]), 
                quickReplyButton("Ver Tudo", `${config.prefix}menuall`),
                quickReplyButton("Ping", `${config.prefix}ping`),
                urlButton("Repositório", "https://github.com/HenriqueX-Flow/Incomplete.git")]
            });
        }

        if (setting.style == "3") {
            return await client.reply(m.chat, fullList());
        }
    }
}
