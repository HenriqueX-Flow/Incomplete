/**
 * Quanto De XP É Necessário Pra Passar Do Nível N Pro N+1.
 * Fórmula Parecida Com A De Vários Bots De Nível Conhecidos: Cresce
 * Um Pouco A Cada Nível, Sem Ficar Impossível Rápido Demais.
 * @param {number} level
 * @returns {number}
 */
export function xpForLevel(level) {
    return 5 * level ** 2 + 50 * level + 100;
}

/**
 * @typedef {Object} LevelProgress
 * @property {number} level - Nível Atual
 * @property {number} xpIntoLevel - XP Já Ganho Dentro Do Nível Atual
 * @property {number} xpNeeded - XP Total Necessário Pra Completar O Nível Atual
 * @property {number} progress - Fração De 0 A 1 Do Progresso No Nível Atual
 */

/**
 * Descobre O Nível Atual E O Progresso A Partir Do XP Total Acumulado.
 * @param {number} totalXp
 * @returns {LevelProgress}
 */
export function getLevelProgress(totalXp) {
    let level = 0;
    let remaining = totalXp;
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level);
        level++;
    }
    const xpNeeded = xpForLevel(level);
    
    return {
        level,
        xpIntoLevel: remaining,
        xpNeeded,
        progress: remaining / xpNeeded
    };
}

/**
 * Dá XP Aleatório Pro Usuário. Pensado Pra Ser Chamado A Cada Mensagem
 * (Com Cooldown Controlado Por Fora, No Handler).
 * @param {import('../core/models.js').UserData} user
 * @param {number} [min]
 * @param {number} [max]
 * @returns {{ leveledUp: boolean, level: number }}
 */
export function addXp(user, min = 8, max = 20) {
    const before = getLevelProgress(user.xp || 0).level;
    user.xp = (user.xp || 0) + Math.floor(Math.random() * (max - min + 1)) + min;
    const after = getLevelProgress(user.xp).level;
    
    return {
        leveledUp: after > before,
        level: after
    }
}