# GitHub Copilot — Instruções Do Repositório

Use estas instruções ao gerar ou editar código nesse repositório. É um **bot
de WhatsApp educacional feito do zero pra ser simples** — quem usa e quem cria
plugins muitas vezes **não sabe programar**, então clareza vem antes de
"código bonito".

## Regras Essenciais

- **Linguagem:** JavaScript puro, `"type": "module"` (ES Modules). Sem TypeScript.
- **Indentação:** sempre **4 espaços**. Jamais tab.
- **Idioma:** tudo em **Português (pt-BR)** — comentários, strings, respostas do bot.
- **Arquitetura por plugins:** cada comando é um arquivo em `plugins/<categoria>/<nome>.js`,
  auto-descoberto pelo `handler.js`.

## ⭐ Padrão De String (Obrigatório)

**Cada palavra deve começar com LETRA GRANDE (maiúscula)** em qualquer string,
mensagem, comentário ou resposta do bot (inclusive conectivos como "De", "Do",
"Pra", "Em"):

- ✅ `"Olá, Seja Bem Vindo Ao Bot"`, `"Lista De Comandos"`.
- ❌ `"Olá, seja bem vindo ao bot"` (só a primeira letra grande) — errado.

O bot é **só em português**: escreva todos os textos direto no código, sem
sistema de tradução (o multiidioma foi descontinuado — `locales/*.json` não
existe mais).

## Criar Um Plugin Novo

Copie de `plugins/example/flags.js`:

```js
/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["meunome", "alias"],
    use: "<mensagem>",
    help: ["-fla <valor>   Explica a flag"],
    category: "example",
    run: async (m, { client, db, config, args, Utils, ... }) => {
        return m.reply("Comando Funcionando!")
    }
}
```

## Flags Estilo Terminal

3 tipos de "pedaço", nessa ordem (ver `src/core/flags.js`):

1. **AÇÃO** — `-add` (1 traço, 1º token).
2. **FLAGS** — `--nome valor` (2 traços); sem valor vira `true`.
3. **POSICIONAL** — o que sobrar.

**Use sempre `positional` de `parseFlags`, nunca `args[0]` direto** (quando há
ação, `args[0]` é a própria ação).

## Textos E Documentação

- Textos de resposta → escreva **direto em Português (pt-BR)** no código,
  seguindo o padrão de letras grandes. Texto reutilizado vira constante/helper,
  **nunca** sistema de tradução.
- **Sistemas/arquivos novos** → documente com **JSDoc sempre que fizer sentido**
  (`@param`, `@returns`, typedefs), em pt-BR.
- Erros: use `logError(contexto, err)` de `error.js` no lugar de `console.log`
  no catch. Nunca logue credenciais.
