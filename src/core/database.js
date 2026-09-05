import fs from "fs";
import path from "path";
import { jidNormalizedUser } from "baileys";
import { Utils } from "./utils.js";
import {
    models,
    structure
} from "./models.js";

/**
 * Remove O Sufixo De Dispositivo (`:device`) De Um Jid Pra Que Todos Os
 * Dispositivos Do Mesmo Número Caiam No Mesmo Registro Do Banco.
 * @param {string} jid
 * @returns {string}
 */
function normalizeJid(jid) {
    if (!jid) return jid;
    return jidNormalizedUser(jid);
}

/**
 * Banco De Dados Simples Baseado Em Arquivo JSON.
 */
export class Database {
    /** @param {string} file - Caminho Do Arquivo .json Do Banco */
    constructor(file) {
        this.file = file;
        /** @type {import("./models.js").Database} */
        this.data = structuredClone(structure);
        this._saveTimeout = null;
        this.load()
    }

    load() {
        const dir = path.dirname(this.file);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
            recursive: true
        })
        if (fs.existsSync(this.file)) {
            try {
                const raw = fs.readFileSync(this.file, "utf-8");
                const parsed = JSON.parse(raw);
                this.data = {
                    ...structuredClone(structure),
                    ...parsed,
                    system: {
                        ...structuredClone(models.system),
                        ...(parsed.system || {})
                    },
                    statistic: {
                        ...structuredClone(models.statistic),
                        ...(parsed.statistic || {})
                    }
                }
                this.migrateKeys()
            } catch (e) {
                Utils.log.error("Falha Ao Ler O Banco, Criando Um Novo:", e.message)
                this.save()
            }
        } else {
            this.save()
        }
    }

    /** Salva Com Debounce Pra Não Gravar No Disco A Cada Mensagem */
    save() {
        clearTimeout(this._saveTimeout)
        this._saveTimeout = setTimeout(() => {
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2))
        }, 800)
    }

    /**
     * Consolida As Chaves Antigas Que Ainda Têm Sufixo De Dispositivo
     * (Ex: `558896110835:50@s.whatsapp.net`) Na Chave Normalizada
     * (`558896110835@s.whatsapp.net`), Unindo Os Dados De Cada Registro.
     */
    migrateKeys() {
        let changed = false;
        for (const section of ["users", "groups", "chats"]) {
            for (const [jid, data] of Object.entries(this.data[section])) {
                const key = normalizeJid(jid);
                if (key === jid) continue;
                if (!this.data[section][key]) {
                    this.data[section][key] = data;
                } else {
                    this.data[section][key] = {
                        ...data,
                        ...this.data[section][key]
                    };
                }
                delete this.data[section][jid];
                changed = true;
            }
        }
        if (changed) this.save();
    }

    /**
     * Pega (Ou Cria) Os Dados De Um Usuário
     * @param {string} jid
     * @returns {import("./models.js").UserData}
     */
    getUser(jid) {
        const key = normalizeJid(jid);
        if (!this.data.users[key]) this.data.users[key] = structuredClone(models.users)
        return this.data.users[key]
    }

    /**
     * Pega (Ou Cria) Os Dados De Um Grupo
     * @param {string} jid
     * @returns {import("./models.js").GroupData}
     */
    getGroup(jid) {
        const key = normalizeJid(jid);
        if (!this.data.groups[key]) this.data.groups[key] = structuredClone(models.groups)
        return this.data.groups[key]
    }

    /**
     * Pega (Ou Cria) Os Dados De Um Chat (Grupo). Guarda A Configuração De
     * Welcome/Leave (Ver src/whatsapp/greetings.js).
     * @param {string} jid
     * @returns {import("./models.js").ChatData}
     */
    getChat(jid) {
        const key = normalizeJid(jid);
        if (!this.data.chats[key]) this.data.chats[key] = structuredClone(models.chats)
        return this.data.chats[key]
    }

    /**
     * Guarda De Vez O Par @lid ↔ Número Real De Um Contato.
     * @param {string} lid - Jid No Formato @lid
     * @param {string} phoneNumber - Jid No Formato @s.whatsapp.net
     * @param {string} [name] - pushName, Se Tiver
     */
    linkContact(lid, phoneNumber, name) {
        if (!lid || !phoneNumber || !lid.endsWith("@lid") || lid === phoneNumber) return;
        const prev = this.data.contacts[lid];
        this.data.contacts[lid] = {
            ...structuredClone(models.contacts),
            phoneNumber,
            name: name || prev?.name || null,
            updatedAt: Date.now()
        }
        this.save()
    }

    /**
     * Tenta Achar O Número Real Já Guardado Pra Um @lid.
     * @param {string} jid
     * @returns {string|null} O Número (@s.whatsapp.net), Ou null Se Nunca Vimos Esse @lid Antes
     */
    resolveLid(jid) {
        if (!jid || !jid.endsWith("@lid")) return null;
        return this.data.contacts[jid]?.phoneNumber || null;
    }
    
    /**
     * Pega O Nome Salvo De Um Contato, Se Já Tiver Visto Alguma Mensagem Dele.
     * @param {string} jid
     * @returns {string|null}
     */
    getContactName(jid) {
        if (this.data.contacts[jid]) {
            return this.data.contacts[jid].name
        }
        
        for (const contact of Object.values(this.data.contacts)) {
            if (contact.phoneNumber === jid) {
                return contact.name
            }
        }

        return null
    }
    /**
     * Soma +1 No Contador De Comandos Usados Com Sucesso (statistic.commandsUsed).
     * Chamado Pelo Handler Depois Que Um Plugin Roda Sem Dar Erro.
     */
    trackCommand() {
        this.data.statistic.commandsUsed = (this.data.statistic.commandsUsed || 0) + 1
        this.save()
    }

    /**
     * Soma +1 No Contador De Erros (statistic.errors). Chamado Pelo Handler
     * Quando Um Plugin Cai No Catch.
     */
    trackError() {
        this.data.statistic.errors = (this.data.statistic.errors || 0) + 1
        this.save()
    }
}