#!/usr/bin/env node

/**
 * check-syntax.js
 *
 *
 * Roda:
 *   node scripts/check-syntax.js           (usa o node --check)
 *
 * Sai Com Código 0 Se Tudo Estiver Ok, E 1 Se Algum Arquivo Falhar.
 * Usado Pelos Workflows De CI/Release No GitHub (ci.yml E release.yml)
 * Pra Substituir O `npm run typecheck`/`npm run build` Que Não Existem
 * Nesse Projeto JS Puro.
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Pastas Onde Fica O Código Que O Bot Carrega/Executa. Não Perambulamos
// Por node_modules, .venv, session, database etc (são lixo/gerados).
const SCAN_DIRS = ["src", "scripts"];

/**
 * Lista Todos Os Arquivos .js Dentro De Uma Pasta, Recursivamente.
 * @param {string} dir
 * @returns {string[]}
 */
function walkJs(dir) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    let results = [];
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        const abs = path.join(full, entry.name);
        if (entry.isDirectory()) results = results.concat(walkJs(path.join(dir, entry.name)));
        else if (entry.name.endsWith(".js")) results.push(abs);
    }
    return results;
}

let failed = 0;

for (const dir of SCAN_DIRS) {
    for (const file of walkJs(dir)) {
        try {
            // node --check valida a sintaxe sem executar o arquivo.
            execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
        } catch (e) {
            failed++;
            const rel = path.relative(ROOT, file);
            console.error(`✖ Erro De Sintaxe Em ${rel}:`);
            // Mostra Só A Primeira Linha Da Saída Do Node (a mensagem do erro).
            const msg = String(e?.stderr || e?.message || "").split("\n").find((l) => l.trim());
            if (msg) console.error(`  ${msg}`);
        }
    }
}

if (failed) {
    console.error(`\n${failed} Arquivo(s) Com Erro De Sintaxe.`);
    process.exit(1);
}

console.log(`✔ Sintaxe OK Em Todos Os Arquivos .js (${SCAN_DIRS.join(", ")})`);
