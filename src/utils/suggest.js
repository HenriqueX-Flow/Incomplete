/**
 * Distância de Levenshtein (variante Damerau/"optimal string alignment"):
 * quantas edições — trocar, adicionar, tirar ou inverter duas letras
 * vizinhas — são necessárias pra transformar uma palavra na outra.
 * A parte de "inverter duas letras vizinhas" é o que faz "pign" ser
 * reconhecido como quase igual a "ping" (erro de digitação comum).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
    const m = a.length
    const n = b.length
    const dp = Array.from({
        length: m + 1
    }, () => new Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1, // remover
                dp[i][j - 1] + 1, // adicionar
                dp[i - 1][j - 1] + cost // trocar (ou nada, se já for igual)
            )
            // duas letras vizinhas trocadas de lugar (ex: "pign" -> "ping")
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1)
            }
        }
    }

    return dp[m][n]
}

/**
 * Acha o comando existente mais parecido com o que a pessoa digitou
 * errado. Só sugere se a diferença for pequena o suficiente pra fazer
 * sentido (senão qualquer coisa digitada errada "sugeriria" um comando
 * aleatório, o que ficaria estranho).
 * @param {string} input - o que a pessoa digitou (sem o prefixo)
 * @param {{ usage: string[], category: string }[]} pluginList
 * @returns {{ command: string, category: string }|null}
 */
export function findClosestCommand(input, pluginList) {
    let best = null
    let bestDistance = Infinity

    for (const plugin of pluginList) {
        for (const name of plugin.usage) {
            const distance = levenshtein(input, name)
            if (distance < bestDistance) {
                bestDistance = distance
                best = {
                    command: name,
                    category: plugin.category
                }
            }
        }
    }

    if (!best) return null

    // tolerância proporcional ao tamanho da palavra: erro de 1 letra numa
    // palavra curta conta muito mais que numa palavra longa
    const threshold = Math.max(1, Math.floor(input.length * 0.4))
    return bestDistance <= threshold ? best : null
}