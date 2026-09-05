/**
 * Verifica Se O Usuário É Premium No Momento. Se O Premium Temporário
 * Já Passou Da Validade, Desativa Automaticamente (O Chamador Deve Salvar
 * O Banco Depois, Se For O Caso Essa Função Só Mexe No Objeto Em Memória).
 * @param {import("./models.js").UserData} user
 * @returns {boolean}
 */
export function isPremium(user) {
    if (!user.premium) return false;
    
    if (user.premiumUntil && Date.now() > user.premiumUntil) {
        user.premium = false;
        user.premiumUntil = null;
        return false;
    }
    
    return true;
}

/**
 * Concede Premium A Um Usuário.
 * @param {import("./models.js").UserData} user
 * @param {number|null} [durationMs] - null/undefined = permanente
 */
export function grantPremium(user, durationMs) {
    user.premium = true;
    user.premiumUntil = durationMs ? Date.now() + durationMs : null;
}

/**
 * Remove O Premium De Um Usuário.
 * @param {import("./models.js").UserData} user
 */
export function revokePremium(user) {
    user.premium = false;
    user.premiumUntil = null;
}