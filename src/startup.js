#!/usr/bin/env node

/**
 * startup.js
 *
 * Assistente De Configuração Inicial Do Bot. Roda Antes Do index.js:
 * Pergunta Método De Conexão, Nome Do Bot, Nome Do Dono, Número Do Dono
 * E Número Que O Bot Vai Usar, Salva Tudo No config.json E Então Inicia O Bot.
 *
 * Se Já Existir Uma Sessão Salva (./session/creds.json), Assume Que Não
 * É A Primeira Execução E Pula Direto Para O Start Do Bot.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "node:child_process";
import chalk from "chalk";
import * as clack from "@clack/prompts";
import Utils from "#core/utils.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "config.json");
const SESSION_DIR = path.join(__dirname, "..", "session");
const SESSION_CREDS_PATH = path.join(SESSION_DIR, "creds.json");

/**
 * Verifica Se Já Existe Uma Sessão Salva Do WhatsApp.
 * Usado Para Decidir Se Pulamos O Wizard De Perguntas.
 * @returns {boolean}
 */
function hasExistingSession() {
   return fs.existsSync(SESSION_CREDS_PATH);
}

/**
 * Lê O config.json Atual.
 * @returns {object} Config Atual
 */
function readCurrentConfig() {
   if (!fs.existsSync(CONFIG_PATH)) return {};

   try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
   } catch (err) {
      console.error(Utils.log.error("STARTUP", "Não Consegui Ler O config.json Existente, Começando Do Zero."));
      return {};
   }
}

/**
 * Mescla As Respostas Do Wizard Com O config.json Já Existente E Salva No Disco.
 * Preserva Chaves Que Não Fazem Parte Do Wizard (economy, xp, antiflood, etc).
 * @param {object} currentConfig - config.json Atual
* @param {{ connectionMethod: string, botName: string, ownerNumber: string, botNumber: string, ownerName: string }} answers
 */
function saveConfig(currentConfig, answers) {
    const mergedConfig = {
        ...currentConfig,
        botName: answers.botName,
        owner: [answers.ownerNumber],
        ownerName: answers.ownerName,
        session: {
         ...currentConfig.session,
         usePairingCode: answers.connectionMethod === "pairing",
         phoneNumber: answers.botNumber,
      },
   };

   fs.writeFileSync(CONFIG_PATH, JSON.stringify(mergedConfig, null, 4), "utf-8");
}


/**
 * Valida Um Número De Telefone (Apenas Dígitos, Com DDI + DDD).
 * @param {string} value
 * @returns {string|undefined} Mensagem De Erro, Ou Undefined Se For Válido
 */
function validatePhoneNumber(value) {
   const digitsOnly = (value || "").replace(/\D/g, "");
   if (digitsOnly.length < 10) {
      return "Digite Um Número Válido Com DDI E DDD (ex: 5588999999999)";
   }
}

/**
 * Encerra O Wizard Imediatamente Caso O Usuário Cancele (Ctrl+C / Esc)
 * Em Qualquer Uma Das Perguntas Do @clack/prompts.
 * @param {unknown} value - Retorno De Uma Prompt Do Clack
 */
function exitIfCancelled(value) {
   if (clack.isCancel(value)) {
      clack.cancel("Configuração Cancelada.");
      process.exit(0);
   }
}

/**
 * Roda O Fluxo De Perguntas Interativas Do Wizard De Configuração.
 * @returns {Promise<{ connectionMethod: string, botName: string, ownerName: string, ownerNumber: string, botNumber: string }>}
 */
async function runSetupWizard() {
   clack.intro(chalk.bgCyan.black(" Configuração Do Bot "));

   const connectionMethod = await clack.select({
      message: "Como Você Quer Conectar?",
      options: [{
            value: "qrcode",
            label: "QR CODE -",
            hint: "SCANEAR O QRCODE"
         },
         {
            value: "pairing",
            label: "CÓDIGO DE PAREAMENTO -",
            hint: "RECOMENDADO PARA CELULAR"
         },
      ],
   });
   
   exitIfCancelled(connectionMethod);

   const botName = await clack.text({
      message: "QUAL SERÁ O NOME DO BOT?",
      placeholder: "Incomplete",
      validate: (value) => {
         if (!value || value.trim().length === 0) return "O Nome Não Pode Ficar Em Branco.";
      },
   });
   exitIfCancelled(botName);

   const ownerNumber = await clack.text({
      message: "QUAL É O NÚMERO DO DONO DO BOT?",
      placeholder: "5588999999999",
      validate: validatePhoneNumber,
   });
exitIfCancelled(ownerNumber);

    const ownerName = await clack.text({
        message: "QUAL É O SEU NOME (DONO DO BOT)?",
        placeholder: "HenriqueX",
        validate: (value) => {
            if (!value || value.trim().length === 0) return "O Nome Não Pode Ficar Em Branco.";
        },
    });
    exitIfCancelled(ownerName);

    let botNumber = ownerNumber;

   if (connectionMethod === "pairing") {
      const answer = await clack.text({
         message: "QUAL NÚMERO O BOT VAI USAR PARA CONECTAR (PAREAMENTO)?",
         placeholder: "5588999999999",
         initialValue: ownerNumber,
         validate: validatePhoneNumber,
      });
      exitIfCancelled(answer);
      botNumber = answer;
   }

   const connectionLabel = connectionMethod === "pairing" ? "CÓDIGO DE 8 DÍGITOS" : "QR CODE";

const confirmed = await clack.confirm({
        message: `Confirmar:\nBOT "${botName}"\nDONO "${ownerName}" (${ownerNumber})\nCONEXÃO VIA ${connectionLabel}?`,
    });
   exitIfCancelled(confirmed);

   if (!confirmed) {
      clack.cancel("Configuração Cancelada.");
      process.exit(0);
   }

   clack.outro(chalk.green("Configuração Salva Com Sucesso"));

return {
        connectionMethod,
        botName: botName.trim(),
        ownerNumber: ownerNumber.replace(/\D/g, ""),
        botNumber: botNumber.replace(/\D/g, ""),
        ownerName: ownerName.trim(),
    };
}

/**
 * Inicia O Bot Principal (index.js) Depois Que O config.json Tá Pronto.
 * Usa spawn Com stdio: "inherit" Pra Que O Processo Filho Herde O TTY
 * Do Terminal — Sem Isso O chalk Detecta stdout Sem TTY E Desliga As
 * Cores Dos Logs.
 */
function launchBot() {
    const child = spawn("node", ["index.js"], {
        stdio: "inherit",
        cwd: __dirname,
    });
    child.on("exit", (code) => process.exit(code ?? 0));
}

/**
 * Ponto De Entrada Do startup.js.
 */
async function main() {
    if (hasExistingSession()) {
        clack.log.info(Utils.log.info("STARTUP", "Sessão Existente Encontrada • Pulando Configuração Inicial."));
        launchBot();
        return;
    }

    const answers = await runSetupWizard();
    const currentConfig = readCurrentConfig();
    saveConfig(currentConfig, answers);
    launchBot();
}

main().catch((err) => {
   console.error(Utils.log.error("STARTUP", "Erro Ao Rodar O Assistente De Configuração:"), err);
   process.exit(1);
});
