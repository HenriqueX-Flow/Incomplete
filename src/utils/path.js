import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Diretório raiz do projeto.
 *
 * src/utils/path.js
 *       ↑
 *       └── ../../ = raiz
 */
const ROOT = path.resolve(__dirname, "../..");

/**
 * Aliases do projeto.
 *
 * Devem corresponder aos aliases definidos
 * no campo "imports" do package.json.
 */
const aliases = {
    "#assets": "assets",
    "#media": "media",
    "#core": "src/core",
    "#app": "src",
    "#plugins": "src/plugins",
    "#canvas": "src/canvas",
    "#utils": "src/utils",
    "#whatsapp": "src/whatsapp"
};

/**
 * Resolve um caminho do projeto.
 *
 * Aceita:
 *   resolve("#media/image/thumb.png")
 *   resolve("#core/database.js")
 *   resolve("#plugins/menu.js")
 *   resolve("media/image/thumb.png")
 *   resolve("package.json")
 *
 * @param {string} target
 * @returns {string}
 */
export function resolve(target) {
    if (typeof target !== "string" || !target.trim()) {
        throw new TypeError("O caminho precisa ser uma string válida.");
    }

    const match = target.match(/^(#[^/]+)(?:\/(.*))?$/);

    if (match) {
        const [, alias, subPath = ""] = match;

        if (!(alias in aliases)) {
            throw new Error(`Alias desconhecido: ${alias}`);
        }

        return path.resolve(
            ROOT,
            aliases[alias],
            subPath
        );
    }

    return path.resolve(ROOT, target);
}

/**
 * Verifica se um caminho existe.
 *
 * @param {string} target
 * @returns {boolean}
 */
export function exists(target) {
    return fs.existsSync(resolve(target));
}

/**
 * Lê um arquivo como Buffer.
 *
 * Ideal para:
 *   fs.readFileSync(resolve("#media/image/thumb.png"))
 *
 * @param {string} target
 * @returns {Buffer}
 */
export function read(target) {
    return fs.readFileSync(resolve(target));
}

/**
 * Lê um arquivo como texto.
 *
 * @param {string} target
 * @param {BufferEncoding} [encoding="utf8"]
 * @returns {string}
 */
export function readText(target, encoding = "utf8") {
    return fs.readFileSync(resolve(target), encoding);
}

/**
 * Retorna o diretório raiz do projeto.
 *
 * @returns {string}
 */
export function root() {
    return ROOT;
}

/**
 * Resolve o caminho de um alias sem precisar
 * conhecer a estrutura física do projeto.
 *
 * @example
 * resolve("#media/image/thumb.png")
 */
export default resolve;