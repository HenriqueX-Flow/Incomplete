/**
 * Tira O "@sufixo" (E O ":dispositivo", Se Tiver) De Um JID/LID, Deixando
 * Só A Parte Que Identifica A Pessoa. Funciona Tanto Pra
 * "5511999999999@s.whatsapp.net" Quanto Pra "49414169206835@lid" E
 * Também Perdoa Se Alguém Colar O Identificador Inteiro (Com @) Na Lista
 * De Donos Do config.json Por Engano, Porque A Lista Também Passa Por Aqui.
 * @param {string} jid
 * @returns {string}
 */
export function bareId(jid) {
    return String(jid).split("@")[0].split(":")[0];
}

/**
 * Verifica Se Um Remetente (JID De Telefone @s.whatsapp.net OU De LID
 * @lid — o WhatsApp Vem Trocando Um Pelo Outro Dependendo Do Contexto E
 * Da Privacidade De Cada Conta) É Um Dos Donos Configurados.
 *
 * O `config.json` Aceita As Duas Formas Na Lista `owner`: o Número De
 * Telefone Ou O LID, Com Ou Sem O Sufixo "@...".
 * @param {string} senderJid
 * @param {string[]} ownerList
 * @returns {boolean}
 */
export function isOwnerJid(senderJid, ownerList) {
    const target = bareId(senderJid);
    return ownerList.some((entry) => bareId(entry) === target);
}