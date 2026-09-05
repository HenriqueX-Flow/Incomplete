# AGENTS.md — Regras Pra Qualquer IA Que Trabalhar Nesse Repositório

Esse Arquivo Descreve **Como Trabalhar Nesse Projeto**. Leia Antes De Criar,
Editar ou Dar Manutenção Em Qualquer Código. O Projeto É Escrito **Do Zero
Pra Ser Bonito E Simples De Entender** — Quem Usa (E Quem Cria Plugins) Muitas Vezes
**Não Sabe Programar**, Então Tudo Aqui Prioriza Clareza Sobre "Código Bonito".

Resumo (TL;DR):

- **Linguagem:** JavaScript Puro, ES Modules (`"type": "module"`).
- **Indentação:** Sempre **4 Espaços**. Espaço Ou Tab Nunca **2 De Espaço**.
- **Idioma Dos Textos/Código:** **Português (pt-BR)** — Comentários, Strings
  E Respostas Do Bot, Exceto Código, Variáveis Funções, Classes Ou Qualquer Coisa Que Seja Código Sempre Em Inglês Padrão.
- **A Arquitetura É Por Plugins:** Cada Comando É Um Arquivo Dentro De
  `src/plugins/<categoria>/<nome>.js`.
- **Sistema De Flags Estilo Terminal** (ações `-x`, flags `--nome valor`,
  posicionais) — Explicado Abaixo.
- **Sem Multiidioma:** O Bot É **Só Em Português (pt-BR)**. Os Textos São
  Escritos Direto No Código, Sem Sistema De Tradução.
- **Comentários E JSDoc:** Curtos E Diretos Ao Ponto. Evite Textos Longos E
  "Justificativas" De Código.

---

## 1. O Que Esse Projeto É

Um **Bot De WhatsApp Educacional** (Feito Com [Baileys](https://github.com/WhiskeySockets/Baileys))
Que Existe Principalmente **Pra Estudar JavaScript** E Rodar Até No Celular
(Termux). As Pessoas Usam **Comandos** (`!ping`, `!menu`, `!saldo`, ...) No
WhatsApp E O Bot Responde.

Por Isso: **Nunca Complique O Que Pode Ser Simples.** Código Legível E Claro
Vale Mais Do Que "Otimização" Aqui.

```
src/
  plugins/             ← COMANDOS (O Que Você Vai Criar/Editá-lo Com Mais Frequência)
    admin/             ← ações de grupo, antilink, welcome/leave
    convert/           ← figurinhas
    economy/           ← saldo, daily, loja, comprar
    example/           ← exemplos prontos (flags.js, vip.js, ...) PRA COPIAR
    mixs/              ← ping, runtime
    owner/             ← add, ban, config, premium, restart, ...
    user/              ← level, me
  core/                ← args (flags), database, utils, message, owner, premium
  whatsapp/            ← antilink, buttons, greetings, convert
  game/                ← levels, games, duel
  canvas/              ← rank card, duelo card (imagens)
  utils/               ← suggest, zip
```

---

## 2. Padrão De Texto / Strings (**IMPORTANTE — Regra Do Bot**)

O Bot Tem Um Padrão De Escrita De Texto. **Aplique SEMPRE Em Strings,
Mensagens, Comentários E Respostas Do Bot:**

> **"Esse É O Padrão, De String, Com Letras Grandes No Início"**

Ou Seja:

- **Cada Palavra Começa Com Letra Grande (MAIÚSCULA).** Não É Só "Primeira
  Letra Da Frase".
- Exemplos De Como **Escrever**:
  - ❌ `"Olá, seja bem vindo ao bot"` → Só A Primeira Letra Grande.
  - ✅ `"Olá, Seja Bem Vindo Ao Bot"` → **Toda** Palavra Com Letra Grande.
  - ❌ `"comando indisponível"` → Nada De Letra Grande.
  - ✅ `"Comando Indisponível"` → Letras Grandes No Início De Cada Palavra.
- Conectivos E Palavras Pequenas ("De", "Do", "Da", "Pra", "Em", "Um")
  **Também** Seguem A Regra Quando Estiverem Dentro De Uma String/Mensagem 
  De Resposta: `"Seja Bem Vindo Ao Bot"`, `"Lista De Comandos"`,
  `"Sistema De Níveis"`.

**Por Que Isso Importa:** É A Assinatura Visual Do Bot E Aparece Em Todas 
As Respostas Que O Bot Manda Pro Usuário, Sempre Em Português (pt-BR).

---

## 3. Indentação E Estilo De Código

- **4 Espaços/Tab Por Nível De Indentação**
- **JavaScript Moderno E Simples:** `async/await`, `const`/`let`, Template
  Literals Com Backtick (\`...\`). Nada De Classes Desnecessárias.
- Nomes De Arquivo E Variáveis Em `camelCase`. Classes Em `PascalCase`.
  Constantes Em `UPPER_SNAKE_CASE`.
- Comentários Em **pt-BR**, Curtos E Diretos Ao Ponto. Explique Só O Que Não
  Fica Óbvio — Nunca Crie Textos Longos Ou Justificativas De Código.

---

## 4. Como Criar Um Comando (Plugin) Novo

Todos Os Comandos São **Auto-Descobertos** Pelo `src/handler.js`. Para Criar Um
Novo Comando, Basta Criar O Arquivo `src/plugins/<categoria>/<nome>.js`.

**Estrutura Mínima (Copie De `src/plugins/example/flags.js`):**

```js
/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["meunome", "alias"],   // Nomes Do Comando (O Índice 0 É O Principal)
    use: "<mensagem>",             // (Opcional) Exemplo De Uso Pro help
    help: [                        // (Opcional) Documenta Cada Flag Pra -h/--help
        "-fla <valor>   Explica A Flag",
    ],
    category: "example",           // Categoria = Pasta Onde O Plugin Está
    run: async (m, { client, db, config, args, Utils, ... }) => {
        // `m.reply("...")` Envia Resposta Com O Padrão De Letras Grandes.
        return m.reply("Comando Funcionando")
    }
}
```

O `run` Recebe `m` (A Mensagem) E Um `ctx` Com Tudo Que Você Precisa:
`client`, `db`, `config`, `Utils`, `args`, `text`, `command`,
`setting`, `premium`, `plugins` Etc. (Ver typedef `PluginContext` Em
`src/handler.js`).

---

## 5. Sistema De Flags (Estilo Terminal / CLI) — REGRA ÚNICA

Um Comando Pode Ter 3 Tipos De "PEDAÇO", **Sempre Nessa Ordem** (Ver
`src/core/flags.js` Pra A Função `parseFlags`):

1. **AÇÃO** — `-algumacoisa` (1 Traço Só, Sempre O 1º Token). Escolhe "O Que 
   Fazer": `-add`, `-delete`, `-on`, `-off`, `-nc`...
2. **FLAGS** — `--nome valor` (2 Traços, Qualquer Ordem). Valor Nomeado.
   Se Não Tiver Valor Depois, Vira `true` (Liga/Desliga, Tipo `--full`).
3. **POSICIONAL** — Qualquer Coisa Que Sobrar Sem Traço.

**IMPORTANTE (Pegadinha Clássica):** Use **Sempre** `positional` (Vem De 
`parseFlags`) Para Argumentos "Crus" — **Nunca** `args[0]` Direto. Quando O
Usuário Usa Uma Ação (`-add`), `args[0]` É A Própria Ação, Não O Valor.
`positional` Já Vem Sem A Ação.

**Help Automático Grátis:** Todo Comando Já Entende `-h` / `--help` De 
Graça (O `src/handler.js` Monta A Ajuda Sozinho Pro Usuário). Se Quiser Deixar
Mais Rico, Preencha `run.help` Com A Explicação De Cada Flag.

---

## 6. Textos Do Bot (Só Em Português)

O Bot **Não Tem Sistema De Tradução** (O Multiidioma Foi Descontinuado).
Todo Texto De Resposta É Escrito **Direto No Código, Em Português (pt-BR)**,
Seguindo O **Padrão De Letras Grandes** (Seção 2).

- Use `m.reply("Texto Em Português")` Direto — Sem Chaves De Tradução.
- Texto Reutilizado Em Vários Lugares? Crie Uma **Constante/Helper** No
  Arquivo Ou Módulo Apropriado, Nunca Um Sistema De Tradução.
- Variável No Meio Do Texto: Use Template Literal (`... ${var}`).
- Mantenha Sempre O **Padrão De Letras Grandes Do Bot** (Seção 2).

---

## 7. Comentários E Documentação (JSDoc)

**Regra Geral: Curto, Direto E Ao Ponto.**

- **Comentários De Código:** Curto E Objetivo, Explicando Só O Que Não Fica
  Óbvio Na Leitura. **Evite** Explicações Longas, "Justificativas" De Porquê
  Ou Comentários Que Repetem O Que O Código Já Mostra.
- **Código Autoexplicativo Primeiro:** Se Precisou Escrever Muito Pra
  Explicar, É Sinal De Que O Código Esteja Complicado — Prefira Refatorar
  (Nomes Claros, Funções Menores) A Comentar Muito.
- **JSDoc:** Curto E Direto. Só `@param` E `@returns` Simples Quando Fizer
  Sentido. Nada De Textos Grandes "Decorando" A Documentação.
- **Código Complexo:** Só Nessas Situações Vale Usar `@description` (Ou Um
  Comentário Maior) Com Uma Explicação Rápida Do Que Acontece E Por Quê.
  Complexidade Pede Explicação, Mas Continue Objetivo.
- **Mudanças Pequenas Em Código Já Existente** Não Precisam De JSDoc Novo —
  Siga O Que Já Está Ali. Use O Bom Senso.

---

## 8. Erros E Segurança

- Use `logError(contexto, err)` (De `error.js`) Ao Capturar Erros, Em Vez De
  Só `console.log` Dentro Do Catch.
- Não Exponha/Logue Credenciais (Número Do Dono, Sessão, Config Sensível).
- O Projeto Já Adverte: É Bot Não-Oficial Via Baileys, Com Risco De Ban.
  Não Faça Nada Que Acelere Automação Detectável (Spam Óbvio, Etc).

---

## 9. O Que NÃO Fazer

- ❌ Não Mude A Forma Como Os Plugins São Carregados Sem Motivo Muito Forte.
- ❌ Não Adicione Frameworks/Bibliotecas Pesadas Pra Resolver Coisa Simples.
- ❌ Não Escreva Texto De Resposta Em **Minúsculas/Primeira Só Maiúscula** —
  Use Sempre O **Padrão De Letras Grandes**.
- ❌ Não Escreva Comentários Longos Ou JSDoc Grande "Decorando" O Código —
  Prefira Código Claro E Comentário Curto E Direto Ao Ponto.
- ❌ Não "Quebre" O Conteceito Educacional: Mantenha O Código Simples E Claro.
