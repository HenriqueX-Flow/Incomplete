import { getLevelProgress } from "#utils/levelSystem.js";
import { renderRankCard } from "#canvas/rankCard.js";
import { fetchBufferWithTimeout } from "#core/utils.js";
import { isPremium } from "#core/premium.js"; 

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["level", "rank", "nivel"],
    category: "user",
    run: async (m, {
        client,
        db,
        Utils,
        config
    }) => {
        const user = db.getUser(m.sender);
        const {
            level,
            xpIntoLevel,
            xpNeeded,
            progress
        } = getLevelProgress(user.xp || 0);
        
        const name = m.pushName;
        
        const premium = isPremium(user); 
        const limit = user.limit || 0;
        const limitMax = 60;

        const avatarUrl = await client.profilePicture(m.sender);
        const avatarBuffer = avatarUrl ? await fetchBufferWithTimeout(avatarUrl) : null;

        try {
            const {
                buffer,
                engine
            } = await renderRankCard({
                name,
                jid: m.sender,
                level,
                progress,
                xpLabel: `${xpIntoLevel}/${xpNeeded} XP`,
                premium,
                limit,
                limitMax,
                botName: config.botName,
                avatarBuffer
            });
            
            const engineLabel = engine === "canvas" ? "Canvas" : "Ffmpeg";
            await client.sendMessage(m.chat, {
                image: buffer,
                caption: `🧠 Nível Do *${name}*: *${level}*\n✨ XP: ${xpIntoLevel}/${xpNeeded} (${Math.round(progress * 100)}%)\n🖥️ Motor: ${engineLabel}`
            }, { quoted: m.raw });
            
        } catch (e) {
            Utils.log.error(`Falha Ao Gerar O Card De Nível: ${e.message}`);
        }
    }
}