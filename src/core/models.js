/**
 * @typedef {Object} UserData
 * @property {number} limit - Quantidade De Usos Restantes
 * @property {boolean} banned - Se O Usuário Tá Banido De Usar O Bot
 * @property {number} lastCommand - Timestamp Do Último Comando Usado (Pra Cooldown)
 * @property {number} xp - XP Total Acumulado (Usado Pro Sistema De Nível)
 * @property {number} lastXp - Timestamp Da Última Vez Que Ganhou XP (Pra Cooldown)
 * @property {number} floodWindowStart - Início Da Janela Atual De Contagem De Flood
 * @property {number} floodCount - Quantos Comandos O Usuário Mandou Na Janela Atual
 * @property {number} floodStrikes - Quantas Vezes Já Foi Advertido Por Flood
 * @property {number} lastFloodStrike - Timestamp Da Última Advertência De Flood
 * @property {boolean} premium - Se O Usuário Tem Status Premium
 * @property {number|null} premiumUntil - Timestamp De Quando O Premium Expira, null = permanente
 * @property {number} nc - Saldo De Nemesis Credits (Moeda Do Bot)
 * @property {number} lastDaily - Timestamp Da Última Vez Que Resgatou O :daily
 * @property {number} antilinkStrikes - Quantas Vezes Já Mandou Link Banido (Pra Penalidade Opcional)
 */

/**
 * @typedef {Object} AntilinkTypeConfig
 * @property {"delete"|"remove"|"protect"} mode
 */

/**
 * @typedef {Object} GroupData
 * @property {Object.<string, AntilinkTypeConfig>} antilink - Por Tipo De link (Ex: "chat", "insta", "yt"); Ausente = Desativado Nesse Grupo
 */

/**
 * @typedef {Object} GreetingConfig
 * @property {boolean} enabled - Desligado Por Padrão; Um Admin Do Grupo Precisa Ativar
 * @property {string|null} message - Mensagem Customizada (Aceita Os Placeholders @user E #user); null = Usa A Mensagem Padrão Embutida
 */

/**
 * @typedef {Object} ChatData
 * @property {GreetingConfig} welcome - Configuração De Boas-Vindas (Ver src/whatsapp/greetings.js)
 * @property {GreetingConfig} leave - Configuração De Mensagem De Saída (Ver src/whatsapp/greetings.js)
 */

/**
 * @typedef {Object} ContactData
 * @property {string|null} phoneNumber - O Jid Real (@s.whatsapp.net) Correspondente A Um @lid
 * @property {string|null} name - Nome (pushName) Que Vimos Da Última Vez
 * @property {number} updatedAt - Timestamp Da Última Atualização
 */

/**
 * @typedef {Object} SystemData
 * @property {boolean} autoread - Se O Bot Marca Mensagens Como Lidas Automaticamente
 * @property {boolean} autotyping - Se O Bot Mostra "Digitando..." Enquanto Processa Um Comando
 * @property {string} style - Estilo Do Menu ("1" = Documento + Thumbnail, "2" = Interativo NativeFlow, "3" = "Simples")
 * @property {"public"|"private"} status - Quem Pode Usar O Bot: Todo Mundo Ou Só O Dono
 * @property {number} lastLimitReset - Timestamp Da Última Vez Que Os Limites De Todo Mundo Foram Resetados
 */

/**
 * @typedef {Object} StatisticData
 * @property {number} commandsUsed - Quantos Comandos Já Foram Executados Com Sucesso, No Total, Desde Sempre
 * @property {number} errors - Quantos Comandos Já Caíram No Catch (Erro) Do Handler, No Total, Desde Sempre
 * @property {number} startedAt - Timestamp Da Última Vez Que O Bot Foi Iniciado (Ver Handler.start)
 */

/**
 * @typedef {Object} Database
 * @property {Object.<string, UserData>} users
 * @property {Object.<string, GroupData>} groups
 * @property {Object.<string, ChatData>} chats - Configuração De Welcome/Leave Por Chat (Ver ChatData)
 * @property {Object.<string, ContactData>} contacts - Mapa @lid → Número Real, Guardado Pra Sempre (Ver src/core/message.js resolveLid)
 * @property {SystemData} system
 * @property {StatisticData} statistic
 */

/**
 * ============================================================================
 * MODELS — O "Molde" De Cada Tipo De Registro Individual Do Banco.
 * ============================================================================
 * Cada Chave Aqui É O Valor Padrão De UM Registro Daquele Tipo (Um Usuário,
 * Um Grupo, Etc). Pra Criar Um Registro Novo, é Só Clonar: Ex.
 * `structuredClone(models.users)` Vira Um UserData Novo, Com Os Valores
 * Padrão. `system` E `statistic` São "Singletons" (Só Existe 1 No Banco
 * Inteiro, Não É Um Registro Por Jid) — Os Outros São Templates Usados Um
 * Por Jid (users["5511...@s.whatsapp.net"], groups["...@g.us"], Etc).
 * ============================================================================
 * @type {{
 *   users: UserData,
 *   groups: GroupData,
 *   chats: ChatData,
 *   contacts: ContactData,
 *   system: SystemData,
 *   statistic: StatisticData
 * }}
 */
export const models = {
    users: {
        limit: 20,
        banned: false,
        lastCommand: 0,
        xp: 0,
        lastXp: 0,
        floodWindowStart: 0,
        floodCount: 0,
        floodStrikes: 0,
        lastFloodStrike: 0,
        premium: false,
        premiumUntil: null,
        nc: 0,
        lastDaily: 0,
        antilinkStrikes: 0,
    },
    groups: {
        antilink: {}
    },
    chats: {
        welcome: {
            enabled: false,
            message: null
        },
        leave: {
            enabled: false,
            message: null
        }
    },
    contacts: {
        phoneNumber: null,
        name: null,
        updatedAt: 0
    },
    system: {
        autoread: true,
        autotyping: false,
        style: "1",
        status: "public",
        lastLimitReset: 0
    },
    statistic: {
        commandsUsed: 0,
        errors: 0,
        startedAt: 0
    }
}

/**
 * ============================================================================
 * STRUCTURE — O Banco De Dados Vazio, Do Zero (Primeira Vez Que O Bot Liga).
 * ============================================================================
 * `users`/`groups`/`chats`/`contacts` Começam Vazios ({}) Porque São Mapas
 * Indexados Por Jid — Cada Registro Só É Criado Quando Aquele Usuário/Grupo
 * Realmente Aparece (Ver Database.getUser/getGroup/getChat). Já `system` E
 * `statistic` Começam Direto Com Os Valores Padrão De `models`, Porque Só
 * Existe 1 De Cada No Banco Inteiro.
 * ============================================================================
 * @type {Database}
 */
export const structure = {
    users: {},
    groups: {},
    chats: {},
    contacts: {},
    system: structuredClone(models.system),
    statistic: structuredClone(models.statistic)
}
