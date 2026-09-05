import { runtime } from "#core/utils.js";

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["runtime", "uptime"],
    category: "mixers",
    run: async (m, { client }) => {
        await client.reply(m.chat, `O Bot Está Online Há ${runtime(process.uptime() * 1000)}.`);
    }
}