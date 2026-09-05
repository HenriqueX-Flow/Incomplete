import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

/**
 * @typedef {import("./rankCardCanvas.js").RankCardInput} RankCardInput
 */

/**
 * Gera O Banner De Nível Usando Só O Binário Do Ffmpeg (Mesmo Usado Nas
 * Figurinhas) — Sem Nenhuma Lib Nativa. Não Fica Tão Bonito Quanto A
 * Versão Com Canvas (Sem Texto Desenhado Na Imagem), Mas Funciona Em
 * Qualquer Termux. Os Números (Nível, XP) Vão Na Legenda Da Mensagem.
 * @param {RankCardInput} input
 * @returns {Promise<Buffer>}
 */
export function renderFfmpeg({
    progress,
    avatarBuffer
}) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString("hex");
        const avatarPath = path.join(os.tmpdir(), `rank-avatar-${id}.jpg`);
        const output = path.join(os.tmpdir(), `rank-out-${id}.png`);
        const hasAvatar = !!avatarBuffer;
        if (hasAvatar) fs.writeFileSync(avatarPath, avatarBuffer);

        const width = 900;
        const height = 300;
        const avatarSize = 180;
        const avatarX = 60;
        const avatarY = (height - avatarSize) / 2;
        const barX = avatarX + avatarSize + 40;
        const barWidth = width - barX - 60;
        const barHeight = 30;
        const barY = height / 2 - barHeight / 2;
        const fillWidth = Math.max(barHeight, Math.round(barWidth * Math.min(Math.max(progress, 0), 1)));
        const radius = avatarSize / 2;

        const avatarFilter = `scale=${avatarSize}:${avatarSize}:force_original_aspect_ratio=increase,crop=${avatarSize}:${avatarSize},format=rgba,` + `geq=lum="p(X,Y)":a="if(lte(pow(X-${radius},2)+pow(Y-${radius},2),${radius * radius}),255,0)"`;
        const filterComplex = `[1:v]drawbox=x=${barX}:y=${barY}:w=${barWidth}:h=${barHeight}:color=0x3a3a52:t=fill,` + `drawbox=x=${barX}:y=${barY}:w=${fillWidth}:h=${barHeight}:color=0xf5c542:t=fill[bg];` + `[0:v]${avatarFilter}[avatar];` + `[bg][avatar]overlay=x=${avatarX}:y=${avatarY}[out]`;

        const args = [
            ...(hasAvatar ? ["-i", avatarPath] : ["-f", "lavfi", "-i", `color=size=${avatarSize}x${avatarSize}:color=0x555766`]),
            "-f", "lavfi", "-i", `color=size=${width}x${height}:color=0x1e1e2e`,
            "-filter_complex", filterComplex,
            "-map", "[out]",
            "-frames:v", "1",
            "-y", output
        ]

        const cleanup = () => {
            for (const f of [avatarPath, output]) {
                try {
                    fs.unlinkSync(f)
                } catch {}
            }
        }

        const ff = spawn("ffmpeg", args);
        let stderr = "";
        ff.stderr.on("data", (d) => {
            stderr += d
        });

        ff.on("error", () => {
            cleanup()
            reject(new Error("Ffmpeg Não Encontrado. Rode: install ffmpeg -y"))
        });

        ff.on("close", (code) => {
            if (code !== 0 || !fs.existsSync(output)) {
                cleanup()
                return reject(new Error(`Falha Ao Gerar Banner Com Ffmpeg: ${stderr.slice(-200) || "Erro Desconhecido"}`))
            }
            const result = fs.readFileSync(output)
            cleanup()
            resolve(result)
        });
    });
}