# GEMINI.md — Guia Pra Você (Gemini) Trabalhar Nesse Repositório

Leia antes de criar ou editar qualquer código. É um **bot de WhatsApp
educacional feito do zero pra ser simples** — quem usa e quem cria plugins
muitas vezes **não sabe programar**, então clareza vem antes de "código
bonito".

> **Resumo Rápido:** JavaScript puro (ES Modules), **4 espaços** de indentação
> (sem tab), tudo em **Português (pt-BR)**, arquitetura **por plugins**
> (`plugins/<categoria>/<nome>.js`), sistema de **flags estilo terminal**,
> **sem multiidioma** (textos direto em pt-BR) e **comentários/JSDoc** curtos
> e diretos ao ponto.

---

## 1. O Que Você Precisa Saber Primeiro

- **Linguagem:** JavaScript puro, `"type": "module"` (ES Modules). Sem TypeScript.
- **Indentação:** sempre **4 espaços**. Jamais tab.
- **Idioma:** tudo em **pt-BR** — comentários, strings, respostas do bot.
- **Arquitetura por plugins:** cada comando é um arquivo em
  `plugins/<categoria>/<nome>.js`, auto-descoberto pelo `handler.js`.
- **Infraestrutura:** fica em `src/` (core, whatsapp, game, canvas, utils, plugins).
- **Exemplos prontos pra copiar:** `plugins/example/flags.js` e `vip.js`.

---

## 2. ⭐ O PADRÃO DE STRING (Regra Mais Importante)

O criador tem um padrão inconfundível de escrita. **Aplique SEMPRE em qualquer
string, mensagem, comentário ou resposta do bot:**

> **"Esse É O Padrão, De String, Com Letras Grandes No Inicio"**

**Cada palavra deve começar com LETRA GRANDE (maiúscula)** — não é só a
primeira letra da frase. Conectivos e palavras pequenas ("De", "Do", "Da",
"Pra", "Em", "Um") também seguem a regra quando dentro de uma string de
resposta.

- ✅ `"Olá, Seja Bem Vindo Ao Bot"` — toda palavra com letra grande.
- ✅ `"Lista De Comandos"`, `"Sistema De Níveis"`.
- ❌ `"Olá, seja bem vindo ao bot"` — só a primeira letra grande (errado).
- ❌ `"comando indisponível"` — nada de letra grande (errado).

**O bot é só em português: todos os textos são escritos direto no código, seguindo esse padrão de letras grandes.**

---

## 3. Estilo De Código

- **4 espaços por nível de indentação** (jamais tab).
- **JS moderno e simples:** `async/await`, `const`/`let`, template literals
  com backtick. Nada de classes desnecessárias.
- Nomes de arquivo/variável em **camelCase**. Classes em **PascalCase**.
  Constantes em **UPPER_SNAKE_CASE**.
- Comentários em **pt-BR**, curtos e diretos ao ponto. Explique só o que não
  fica óbvio — nunca crie textos longos ou "justificativas" de código.

---

## 4. Como Criar Um Plugin Novo

Crie o arquivo `plugins/<categoria>/<nome>.js`. Copie de
`plugins/example/flags.js`:

```js
/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["meunome", "alias"],   // nomes do comando (índice 0 é o principal)
    use: "<mensagem>",             // (opcional) exemplo de uso pro help
    help: [                        // (opcional) explica cada flag pro -h/--help
        "-fla <valor>   Explica a flag",
    ],
    category: "example",           // categoria = pasta onde o plugin está
    run: async (m, { client, db, config, args, Utils, ... }) => {
        return m.reply("Comando Funcionando!")   // sempre com letras grandes
    }
}
```

O `run` recebe `m` (a mensagem) e um `ctx` com tudo:
`client`, `db`, `config`, `Utils`, `args`, `text`, `command`,
`setting`, `premium`, `plugins` etc. (typedef `PluginContext` no `handler.js`).

---

## 5. Sistema De Flags (Estilo Terminal) — Preste Atenção

Um comando pode ter 3 tipos de "pedaço", sempre nessa ordem (ver
`src/core/flags.js` → `parseFlags`):

1. **AÇÃO** — `-algumacoisa` (1 traço, 1º token). Escolhe "o que fazer":
   `-add`, `-delete`, `-on`, `-off`, `-nc`...
2. **FLAGS** — `--nome valor` (2 traços). Valor nomeado; sem valor vira `true`
   (liga/desliga, tipo `--full`).
3. **POSICIONAL** — o que sobrar sem traço.

**Pegadinha clássica (não erre!):** para argumentos "crus" use **sempre**
`positional` (vem de `parseFlags`), **nunca** `args[0]` direto. Quando o
usuário usa uma ação (`-add`), `args[0]` é a própria ação, não o valor.

**Help automático grátis:** todo comando entende `-h` / `--help` sozinho (o
`handler.js` monta a ajuda). Deixe mais rico preenchendo `run.help`.

---

## 6. Textos Do Bot (Só Em Português)

O bot **não tem sistema de tradução** (o multiidioma foi descontinuado).
Todo texto de resposta é escrito **direto no código, em Português (pt-BR)**,
seguindo o **padrão de letras grandes** (seção 2).

- Use `m.reply("Texto Em Português")` direto — sem chaves de tradução.
- Texto reutilizado em vários lugares? Crie uma **constante/helper** no
  arquivo ou módulo apropriado, nunca um sistema de tradução.
- Variável no meio do texto: use template literal (`... ${var}`).
- Mantenha sempre o **padrão de letras grandes do bot** (seção 2).

---

## 7. Comentários E Documentação (JSDoc)

**Regra geral: curto, direto e ao ponto.**

- **Comentários de código:** curtos e objetivos, explicando apenas o que não
  fica óbvio. **Evite** explicações longas, "justificativas" de porquê ou
  comentários que repetem o que o código já mostra.
- **Código autoexplicativo primeiro:** se precisou escrever muito pra explicar,
  é sinal de que o código está complicado — prefira refatorar (nomes claros,
  funções menores) a comentar muito.
- **JSDoc:** curto e direto. Só `@param` e `@returns` simples quando fizer
  sentido. Nada de textos grandes "decorando" a documentação.
- **Código complexo:** só nessas situações vale usar `@description` (ou um
  comentário maior) com uma explicação rápida do que acontece e por quê.
  Complexidade pede explicação, mas continue objetivo.
- **Mudanças pequenas** em código existente não precisam de JSDoc novo —
  siga o que já está ali. Use o bom senso.

---

## 8. Erros E Segurança

- Use `logError(contexto, err)` (de `error.js`) pra capturar erros, em vez de
  só `console.log` no catch.
- **Nunca** exponha/logue credenciais (número do dono, sessão, config).
- O bot é não-oficial via Baileys, com risco de ban. Não faça nada que pareça
  automação detectável (spam óbvio, etc).

---

## 9. O Que NÃO Fazer

- ❌ Não mude como os plugins são carregados sem motivo fortíssimo.
- ❌ Não adicione frameworks/bibliotecas pesadas pra coisa simples.
- ❌ Não escreva resposta em minúsculas / só primeira letra maiúscula — use
  sempre o **padrão de letras grandes**.
- ❌ Não escreva comentários longos ou JSDoc grande "decorando" o código —
  prefira código claro e comentário curto e direto.
- ❌ Não "quebre" o conceito educacional: mantenha o código simples e claro.
