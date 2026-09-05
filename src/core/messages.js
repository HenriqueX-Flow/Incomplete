/**
 * Mensagens Padrão Do Bot. Centralizar Aqui Evita Ficar
 * Repetindo String Solta Em Cada Plugin.
 */
export const messages = {
    wait: '(...) Aguarde Um Momento...',
    onlyOwner: '(-) Esse Comando É Só Para O Dono Do Bot.',
    onlyAdmin: '(-) Esse Comando É Só Para Admins Do Grupo.',
    onlyGroup: '(-) Esse Comando Só Funciona Em Grupos.',
    onlyBotAdmin: '(!) Preciso Ser Admin Do Grupo Para Fazer Isso.',
    onlyPremium: '(-) Esse Comando É Exclusivo Pra Usuários Premium. Use !loja Pra Ver Como Conseguir.',
    botPrivate: '(x) O Bot Tá Em Modo Privado No Momento. Só O Dono Pode Usar.',
    noLimit: (name) => `(!) @${name}, Você Ficou Sem Limites De Uso. Volta Amanhã Ou Peça Mais Ao Dono.`,
    needLevel: (name, needed, current) => `@${name}, Esse Comando Só Libera No Nível *${needed}*. Você Tá No Nível *${current}*. Continue Usando O Bot Pra Subir De Nível.`,
    banned: '(x) Você Tá Banido De Usar O Bot.'
}

export const botInfo = {
    name: 'Incomplete',
    version: '1.0.0'
}