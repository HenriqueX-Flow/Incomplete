/**
 * Registro Dos Tipos De Link Que O Antilink Reconhece. Pra Adicionar Um
 * Tipo Novo (Tiktok, Telegram, Etc), Basta Acrescentar Uma Entrada Aqui —
 * O Comando, A Detecção E O Menu Já Entendem Sozinhos, Sem Editar Mais Nada.
 */
export const LINK_TYPES = {
    chat: {
        label: "Link De Grupo Do whatsapp",
        pattern: /chat\.whatsapp\.com\/\S+/i
    },
    insta: {
        label: "Link do Instagram",
        pattern: /(instagram\.com|instagr\.am)\/\S+/i
    },
    yt: {
        label: "Link do YouTube",
        pattern: /(youtube\.com|youtu\.be)\/\S+/i
    }
}

/**
 * Acha Quais Tipos De Link Banidos Aparecem Num Texto.
 * @param {string} text
 * @returns {string[]} Chaves De LINK_TYPES Que Deram Match (Pode Ter Mais De Uma)
 */
export function detectLinks(text) {
    if (!text) return [];
    return Object.entries(LINK_TYPES).filter(([, def]) => def.pattern.test(text)).map(([key]) => key);
}

/**
 * Aplica A Ação Configurada Numa Violação De Antilink.
 * - delete: Só Apaga A Mensagem Com O Link
 * - remove: Apaga A Mensagem E Remove Quem Mandou
 * - protect: Tranca O Grupo (Só Admin Manda Mensagem), Espera Um Pouco,
 *   Apaga O Link, Espera Mais Um Pouco, Remove O Usuário E Destranca O Grupo
 * @param {import("baileys").WASocket} client
 * @param {import("../core/message.js").SimpleMessage} m
 * @param {"delete"|"remove"|"protect"} mode
 * @param {{ protectDelayMs?: number }} [options]
 */
export async function enforceAntilink(client, m, mode, options = {}) {
    const protectDelayMs = options.protectDelayMs ?? 4000;

    const deleteMessage = () => client.sendMessage(m.chat, {
        delete: m.raw.key
    }).catch(() => {})
    const removeUser = () => client.groupParticipantsUpdate(m.chat, [m.sender], "remove").catch(() => {});

    if (mode === "delete") {
        await deleteMessage();
        return;
    }

    if (mode === "remove") {
        await deleteMessage();
        await removeUser();
        return;
    }

    if (mode === "protect") {
        await client.groupSettingUpdate(m.chat, "announcement").catch(() => {});
        await sleep(protectDelayMs);
        await deleteMessage();
        await sleep(protectDelayMs);
        await removeUser();
        await client.groupSettingUpdate(m.chat, "not_announcement").catch(() => {});
    }
}

/** @param {number} ms @returns {Promise<void>} */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}