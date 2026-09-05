import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { parseFlags } from "#core/flags.js"
import { createZip } from "#utils/zip.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "../..")
const DATABASE_DIR = path.join(ROOT, "database")
const SESSION_DIR = path.join(DATABASE_DIR, "session")

/**
 * Lê Todo Arquivo .json Direto Dentro De Uma Pasta (Não Entra Em Subpastas).
 * Usado para o backup de --database.
 */
function collectJsonFiles(dir, zipPrefix) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => ({
            name: `${zipPrefix}/${e.name}`,
            data: fs.readFileSync(path.join(dir, e.name))
        }))
}

/**
 * Lê todos os arquivos do bot recursivamente (entra nas subpastas).
 * Ignora pastas específicas que passarmos na array `ignore`.
 * Usado para o backup --full.
 */
function collectFilesRecursive(dir, basePrefix = "", ignore = []) {
    let results = []
    if (!fs.existsSync(dir)) return results
    
    const list = fs.readdirSync(dir, { withFileTypes: true })

    for (const file of list) {
        if (ignore.includes(file.name)) continue

        const fullPath = path.join(dir, file.name)
        const zipPath = basePrefix ? `${basePrefix}/${file.name}` : file.name

        if (file.isDirectory()) {
            results = results.concat(collectFilesRecursive(fullPath, zipPath, ignore))
        } else if (file.isFile()) {
            results.push({
                name: zipPath,
                data: fs.readFileSync(fullPath)
            })
        }
    }
    return results
}

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["backup"],
    use: "[--full | --database]",
    help: [
        "--full   Backup de todo o bot (plugins, lib, media)",
        "--database  Backup só do config, banco e sessão",
        "--help   Esta ajuda"
    ],
    category: "owner",
    owner: true,
    run: async (m, { client, config, args, Utils }) => {
        const { flags } = parseFlags(args)
        const full = "full" in flags
        const database = "database" in flags

        if (!full && !database) {
            return m.reply(Utils.texted("bold", `Uso Do Comando:\n--full   Backup De Todo O Bot (Plugins, Lib, Media)\n--database  Backup Só Do Config, Banco E Sessão`))
        }

        await m.reply(Utils.texted("italic", "Gerando O Backup, Aguarde Um Instante..."))

        try {
            let files = []
            let captionMsg = ""

            if (database) {
                if (fs.existsSync(path.join(ROOT, "config.json"))) {
                    files.push({ name: "config.json", data: fs.readFileSync(path.join(ROOT, "config.json")) })
                }
                files.push(...collectJsonFiles(DATABASE_DIR, "database"))
                files.push(...collectJsonFiles(SESSION_DIR, "database/session"))
                
                captionMsg = "Backup Dos Dados Do Bot."
            } 
            else if (full) {
                const ignorar = [
                    "node_modules", 
                    "database", 
                    ".git", 
                    "package-lock.json",
                    "error.log" 
                ]
                files = collectFilesRecursive(ROOT, "", ignorar)
                
                captionMsg = "Backup Completo Do Bot."
            }

            if (!files.length) {
                return m.reply(Utils.texted("bold", "Nenhum Arquivo Encontrado Pra Fazer O Backup."))
            }

            const zipBuffer = createZip(files)
            const stamp = new Date().toISOString().replace(/[:.]/g, "-")
            const tipo = database ? "dados" : "full"
            const sizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2)

            await client.sendMessage(m.chat, {
                document: zipBuffer,
                fileName: `backup-${tipo}-${config.botName || "bot"}-${stamp}.zip`,
                mimetype: "application/zip",
                caption: captionMsg + `\nTotal De ${files.length} Arquivo(s), ${sizeMB} MB.`
            })
            
        } catch (e) {
            console.error(e)
            return m.reply(Utils.texted("bold", "Falha Ao Gerar O Backup.") + `\n${Utils.jsonFormat(e)}`)
        }
    }
}
