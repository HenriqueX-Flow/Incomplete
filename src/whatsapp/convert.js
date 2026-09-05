import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const SQUARE_FILTER = "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,format=rgba";
const ROUND_FILTER = "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15,format=rgba," + "geq=lum='p(X,Y)':a='if(lte(pow(X-256,2)+pow(Y-256,2),65536),255,0)'";

/**
 * Converte Um Buffer De Imagem Ou Vídeo Em Webp Usando O Binário Do Ffmpeg
 * Instalado No Sistema (`install ffmpeg`). Não Usa Nenhuma
 * Lib Npm Nativa.
 * @param {Buffer} buffer
 * @param {"image"|"video"} type
 * @param {"square"|"round"} [shape] - "round" Recorta Em Círculo (Estilo Figurinha Redonda)
 * @returns {Promise<Buffer>}
 */
export function toWebp(buffer, type = "image", shape = "square") {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(6).toString("hex");
        const input = path.join(os.tmpdir(), `sticker-in-${id}.${type === "image" ? "jpg" : "mp4"}`);
        const output = path.join(os.tmpdir(), `sticker-out-${id}.webp`);
        fs.writeFileSync(input, buffer);

        const args = [
            "-i", input,
            "-vcodec", "libwebp",
            "-vf", shape === "round" ? ROUND_FILTER : SQUARE_FILTER,
            "-loop", "0",
            "-preset", "default",
            "-an",
            "-vsync", "0",
            ...(type === "video" ? ["-t", "00:00:06"] : []),
            "-y", output
        ]

        const cleanup = () => {
            for (const f of [input, output]) {
                try {
                    fs.unlinkSync(f);
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
            reject(new Error("ffmpeg não encontrado. No Termux, rode: pkg install ffmpeg -y"))
        });

        ff.on("close", (code) => {
            if (code !== 0 || !fs.existsSync(output)) {
                cleanup()
                
                return reject(new Error(`Falha ao converter com ffmpeg: ${stderr.slice(-200) || "erro desconhecido"}`))
            }
            
            const result = fs.readFileSync(output)
            cleanup()
            resolve(result)
        });
    });
}

/**
 * Adiciona Metadados EXIF (Nome Do Pack E Autor) Num Buffer Webp.
 * Isso Normalmente É Feito Com Uma Lib Nativa, Mas Dá
 * Pra Fazer Só Escrevendo Bytes Seguindo O Formato De Arquivo RIFF/WEBP —
 * É Basicamente Colar Um "chunk" A Mais No Arquivo. Sem Dependências.
 * @param {Buffer} webpBuffer
 * @param {{ packname?: string, author?: string }} [options]
 * @returns {Buffer}
 */
export function addExif(webpBuffer, {
    packname = "",
    author = ""
} = {}) {
    const json = {
        "sticker-pack-id": `incomplete-${Date.now()}`,
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: ["🤖"]
    }

    const exifHeader = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifHeader, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4)

    const exifChunk = Buffer.concat([
        Buffer.from("EXIF"),
        u32le(exif.length),
        exif,
        exif.length % 2 ? Buffer.from([0]) : Buffer.alloc(0)
    ]);

    const originalSize = webpBuffer.readUInt32LE(4);
    
    const newHeader = Buffer.concat([
        Buffer.from("RIFF"),
        u32le(originalSize + exifChunk.length),
        Buffer.from("WEBP")
    ]);

    return Buffer.concat([newHeader, webpBuffer.slice(12), exifChunk]);
}

/** @param {number} n @returns {Buffer} */
function u32le(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n, 0);
    
    return b;
}