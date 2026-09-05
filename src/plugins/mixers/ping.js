/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["ping"],
    category: "mixers",
    run: async (m, {
        client
    }) => {
        await client.reply(m.chat, "Pong");
    }
}