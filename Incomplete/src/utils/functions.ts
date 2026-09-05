import fs from "fs";
import path from "path";
import { log } from "./logger.js";

const tempDir = path.resolve(".cache", "temp");

export function createTempDir(): void {
	try {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
			log.warn(`Diretório Criado Em: ${tempDir}`);
		} else {
			log.warn(`Diretório Já Existe: ${tempDir}`);
		}
	} catch (error) {
		log.warn("Erro Ao Criar Diretório: " + error);
	}
}

export function clearTempDir(): void {
	try {
		if (!fs.existsSync(tempDir)) return;

		const files = fs.readdirSync(tempDir);
		for (const file of files) {
			const filePath = path.join(tempDir, file);
			fs.unlinkSync(filePath);
		}

		console.log(`[TempDir] Limpeza concluída: ${files.length} arquivos removidos.`);
	} catch (error) {
		console.error("[TempDir] Erro ao limpar diretório:", error);
	}
}

function initTempSystem(): void {
	createTempDir();

	setInterval(() => {
		clearTempDir();
	}, 10 * 60 * 1000);

	log.warn("Sistema De Limpeza Automática Iniciado (A Cada 10 Min).");
}

export { initTempSystem };
