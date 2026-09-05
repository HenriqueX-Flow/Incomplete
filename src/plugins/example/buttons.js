import { read } from "#utils/path.js";
import {
    quickReplyButton,
    urlButton,
    listButton,
    hiddenButton,
    catalogButton
} from "#whatsapp/buttons.js";

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["botoes", "menu2"],
    category: "example",
    run: async (m, { client, config }) => {
        const categoryConfig = {
            bottom_sheet: {
                in_thread_buttons_limit: 2,
                divider_indices: [1, 2, 3, 4],
                list_title: "Opções",
                button_title: "Opções"
            },
            tap_target_configuration: {
                title: " X ",
                description: "midex_buttons",
                canonical_url: "https://example.com",
                domain: "shop.example.com",
                button_index: 0
            }
        };

        const productMedia = {
            product: {
                productImage: read("#media/image/thumb.png"),
                productId: "26511676515088630",
                title: "© HenriqueX",
                description: "Powered By HenriqueX",
                currencyCode: "BRL",
                priceAmount1000: 25000,
                salePriceAmount1000: 15000,
                retailerId: null,
                url: null
            },
            businessOwnerJid: "558888205721@s.whatsapp.net"
        };
        
        await client.sendInteractive(m.chat, {
            text: "Exemplo De Botões Interativos (NativeFlow):",
            footer: config.botName,
            quoted: m.raw,
            media: productMedia,
            messageJson: categoryConfig,
            buttons: [
                hiddenButton(),
                listButton("Categorias", [{
                    title: "Menu",
                    rows: [{
                            title: "Mixs",
                            description: "ping, runtime",
                            id: `${config.prefix}menu`
                        },
                        {
                            title: "Admin",
                            description: "add, kick, promote, demote",
                            id: `${config.prefix}menu`
                        }
                    ]
                }]),
                quickReplyButton("Ping", `${config.prefix}ping`),
                urlButton("Repositório", "https://github.com/HenriqueX-Flow"),
                catalogButton("Catálogo", "558888205721", "26511676515088630")
            ]
        });
    }
}
