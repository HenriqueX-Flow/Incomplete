import fs from "fs";

const LOG_FILE = "../database/error.log";
const CLEANING_INTERVAL = 1 * 60 * 1000; 

function cleanLog() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const stats = fs.statSync(LOG_FILE);

            if (stats.size > 0) {
                fs.writeFileSync(LOG_FILE, "");
                console.log(`[LOG] Arquivo ${LOG_FILE} Foi Limpo Com Sucesso.`);
            } 
        }
    } catch (err) {
        console.error("[LOG ERROR] Falha Ao Limpar O Arquivo De Log:", err);
    }
}

setInterval(cleanLog, CLEANING_INTERVAL);

/**
 * Loga Um Erro No Console E Num Arquivo, Pra Você Conseguir Ver
 * Depois O Que Quebrou Mesmo Sem Estar Olhando O Terminal Na Hora
 * (Útil Rodando Com pm2 No Termux).
 * @param {string} context - De Onde Veio O Erro (ex: "handler", "plugin:ping")
 * @param {Error|any} error
 */
export function logError(context, error) {
    const line = `[${new Date().toISOString()}] (${context}) ${error?.stack || error}\n`;
    console.error(line);
    try {
        fs.appendFileSync(LOG_FILE, line);
    } catch {}
}
