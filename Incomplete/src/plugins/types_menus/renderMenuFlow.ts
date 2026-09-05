import fs from "fs";
import { Util } from "@core/context.js";
import { readConfig } from "@utils/data-manager.js";
import { buildMenuText } from "./buildMenuText.js";

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function renderMenuFlow(m: Util) {
    const botCfg = readConfig();
    const menuText = buildMenuText(m);

    const category: any = {
        bottom_sheet: {
            in_thread_buttons_limit: 2,
            divider_indices: [1, 2, 3, 4, 5, 999],
            list_title: "Opçôes",
            button_title: "Opçôes"
        },
        tap_target_configuration: {
            title: " X ",
            description: "midex_buttons",
            canonical_url: "https://example.com",
            domain: "shop.example.com",
            button_index: 0
        }
    }

    const product: any = {
        product: {
            productImage: fs.readFileSync("./assets/image/resized.jpg"),
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
    }

    await sleep(1800);
    await m.flow.sendMessage(m.chat, {
        react: { text: "👍", key: m.raw.key }
    });

    await sleep(2000);
    await m.sendButton(m.chat, {
        media: product,
        caption: menuText,
        footer: "© HenriqueX",
        mentions: [m.sender, botCfg.owner],
        buttons: [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    has_multiple_buttons: true
                })
            },
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: 'Opções',
                    sections: [{
                        title: "Opções",
                        highlight_label: "© HenriqueX",
                        rows: [
                            {
                                title: "Menu Geral",
                                description: "Mostrar Os Comandos Da Categoria Geral.",
                                id: `${botCfg.prefix}menu-geral`
                            },
                            {
                                title: "Menu Owner",
                                description: "Mostrar Os Comandos Da Categoria Owner.",
                                id: `${botCfg.prefix}menu-owner`
                            },
                            {
                                title: "Menu Grupo",
                                description: "Mostrar Os Comandos Da Categoria Grupo.",
                                id: `${botCfg.prefix}menu-grupo`
                            }
                        ]
                    }]
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Ping",
                    id: `${botCfg.prefix}ping`
                })
            },
            {
                name: "open_webview",
                buttonParamsJson: JSON.stringify({
                    title: "Seguir",
                    link: {
                        in_app_webview: true,
                        url: "https://github.com/HenriqueX-Flow"
                    }
                })
            },
            {
                name: "automated_greeting_message_view_catalog",
                buttonParamsJson: JSON.stringify({
                    display_text: "Catalogo",
                    business_phone_number: "558888205721",
                    catalog_product_id: "26511676515088630"
                })
            }
        ],
        messageJson: category,
        quoted: m.raw
    })
}
