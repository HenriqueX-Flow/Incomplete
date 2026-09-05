import { Util } from "@core/context.js";
import { CommandHandler } from "@type/command-handler.js";
import { readConfig, writeConfig } from "@utils/data-manager.js";

const boolSettings: Record<string, { key: string; label: string }> = {
    "auto-read": { key: "auto_read_msg", label: "Auto-Read" },
    "auto-type": { key: "auto_type_msg", label: "Auto-Typing" },
    "multi-prefix": { key: "multi_prefix", label: "Multi-Prefix" },
    "no-prefix": { key: "no_prefix", label: "No-Prefix" },
};

const status = (v: boolean) => (v ? "🟢 ATIVO" : "🔴 DESATIVADO");
const category: any = {
    bottom_sheet: { in_thread_buttons_limit: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: "Opçôes", button_title: "Opçôes" },
    tap_target_configuration: { title: " X ", description: "midex_buttons", canonical_url: "https://example.com", domain: "shop.example.com", button_index: 0 },
};

const examples = (prefix: string) => [
    `${prefix}config view`,
    `${prefix}config auto-read on/off`,
    `${prefix}config auto-type on/off`,
    `${prefix}config mode public/private`,
    `${prefix}config set-prefix .`,
    `${prefix}config multi-prefix on/off`,
    `${prefix}config no-prefix on/off`,
    `${prefix}config set-owner 55xxxx`,
    `${prefix}config set-image https://yourimage.example.com`,
].join("\n");

const invalid = (m: Util, text: string) => m.reply("italic", `Veja O Exemplo De Uso:\n${text}`);

const handler: CommandHandler = async (m: Util, { cfg }) => {
    const args = (m.text?.trim() || "").split(/\s+/).slice(1);
    const botCfg = readConfig();
    const prefix = cfg.prefix;

    if (!args.length) {
        return await m.sendButton(m.chat, {
            title: "⚙️ CONFIG",
            subtitle: "Escolha Uma Opção Rápida Ou Use Os Exemplos",
            footer: "@Incomplete",
            quoted: m.raw,
            buttons: [
                { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                { name: "single_select", buttonParamsJson: JSON.stringify({ title: "Opções Rápidas", sections: [
                    { title: "🟢 Ativar", highlight_label: "@HenriqueX", rows: [
                        { title: "Auto-Read", description: "O Bot Passa A Ler As Mensagens Automaticamente", id: `${prefix}config auto-read on` },
                        { title: "Auto-Type", description: "O Bot Digita Antes De Responder", id: `${prefix}config auto-type on` },
                        { title: "Multi-Prefix", description: "Permite Múltiplos Prefixos", id: `${prefix}config multi-prefix on` },
                        { title: "No-Prefix", description: "Permite Comandos Sem Prefixo", id: `${prefix}config no-prefix on` },
                    ] },
                    { title: "🔴 Desativar", highlight_label: "@Incomplete", rows: [
                        { title: "Auto-Read", description: "O Bot Para De Ler Mensagens Automaticamente", id: `${prefix}config auto-read off` },
                        { title: "Auto-Type", description: "O Bot Para De Digitar Antes De Responder", id: `${prefix}config auto-type off` },
                        { title: "Multi-Prefix", description: "Desativa Múltiplos Prefixos", id: `${prefix}config multi-prefix off` },
                        { title: "No-Prefix", description: "Desativa Comandos Sem Prefixo", id: `${prefix}config no-prefix off` },
                    ] },
                    { title: "🧩 Outros", highlight_label: "@Incomplete", rows: [
                        { title: "Modo Público", description: "Libera Uso Para Todos", id: `${prefix}config mode public` },
                        { title: "Modo Privado", description: "Somente Dono", id: `${prefix}config mode private` },
                    ] },
                ] }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Config View (Status)", id: `${prefix}config view` }) },
            ],
            messageJson: category,
        });
    }

    const setting = (args[0] || "").toLowerCase();
    const value = (args[1] || "").toLowerCase();

    if (setting === "view") {
        return await m.reply("quote", `⚙️ *Configurações Atuais*\n\n📖 Auto-Read: ${status(!!botCfg.auto_read_msg)}\n⌨️ Auto-Typing: ${status(!!botCfg.auto_type_msg)}\n🔀 Multi-Prefix: ${status(!!botCfg.multi_prefix)}\n🚫 No-Prefix: ${status(!!botCfg.no_prefix)}\n\n🌐 Modo: ${botCfg.public ? "🟢 Público" : "🔴 Privado"}\n🔑 Prefixo: \`${botCfg.prefix || prefix}\`\n👑 Dono: @${botCfg.owner.split("@")[0] || "Não Definido"}\n🖼️ Imagem Do Menu:\n${botCfg.image || "Não Definida"}`.trim(), { mentions: [botCfg.owner] });
    }

    if (setting === "mode") {
        if (!["public", "private"].includes(value)) return invalid(m, `${prefix}config mode public\n${prefix}config mode private`);
        botCfg.public = value === "public";
        writeConfig(botCfg);
        return await m.reply("quote", `Modo: ${botCfg.public ? "🟢 Público" : "🔴 Privado"}`);
    }

    if (setting === "set-owner") {
        if (!args[1]) return invalid(m, `${prefix}config set-owner 49414169206835@lid`);
        botCfg.owner = args[1];
        writeConfig(botCfg);
        return await m.reply("quote", `Novo Dono Definido:\n${args[1]}`);
    }

    if (setting === "set-prefix") {
        if (!args[1]) return invalid(m, `${prefix}config set-prefix .`);
        botCfg.prefix = args[1];
        writeConfig(botCfg);
        return await m.reply("quote", `Prefixo Atualizado Para: \`${args[1]}\`\nAgora Use: ${args[1]}menu`);
    }

    if (setting === "set-image") {
        if (!args[1]) return invalid(m, `${prefix}config set-image https://files.catbox.moe/y12axo.png`);
        botCfg.image = args[1];
        writeConfig(botCfg);
        return await m.reply("quote", "Imagem Do Menu Atualizada Com Sucesso.");
    }

    if (setting in boolSettings) {
        if (!["on", "off"].includes(value)) return invalid(m, `${prefix}config ${setting} on\n${prefix}config ${setting} off`);
        botCfg[boolSettings[setting].key] = value === "on";
        writeConfig(botCfg);
        return await m.reply("quote", `${boolSettings[setting].label}: ${status(botCfg[boolSettings[setting].key])}`);
    }

    return await m.reply("quote", `Opção Não Disponível.\n\nExemplos:\n${examples(prefix)}`);
};

handler.command = "config";
handler.help = ["config"];
handler.tags = ["owner"];
handler.desc = "+ (opções)";
handler.owner = true;

export { handler };
