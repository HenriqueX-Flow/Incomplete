# CLAUDE.md — Guia Pra Você (Claude) Trabalhar Esse Repositório

Leia Isto Antes De Criar Ou Editar Qualquer Código. O Projeto É Um **Bot De
WhatsApp Educacional Feito Do Zero Pra Ser Simples** — Quem Usa E Quem Cria
Plugins Muitas Vezes **Não Sabe Programar**, Então Clareza Vem Junto De
"Código Bonito".

> **Resumo Rápido:** JavaScript Puro (ES Modules), **4 Espaços** De Indentação
> Tudo Em **Português (pt-BR)**, Arquitetura **Por Plugins**
> (`plugins/<categoria>/<nome>.js`), Sistema De **Flags Estilo Terminal**,
> **Sem Multiidioma** (Textos Direto Em pt-BR) E **Comentários/JSDoc** Curtos
> E Diretos Ao Ponto.

---

## 1. O Que Você Precisa Saber Primeiro

- **Linguagem:** JavaScript Puro, `"type": "module"` (ES Modules). Sem TypeScript.
- **Indentação:** Sempre **4 Espaços**.
- **Idioma:** Tudo Em **pt-BR** — Comentários, Strings, Respostas Do Bot, Menos Variáveis Funções Classes, Ou Qualquer Parte Que Seja Código O Padrão Sempre Inglês.
- **Arquitetura Por Plugins:** Cada Comando É Um Arquivo Em
  `plugins/<categoria>/<nome>.js`, Auto-Descoberto Pelo `handler.js`.
- **Infraestrutura:** Fica Em `src/` (core, whatsapp, game, canvas, utils, plugins).
- **Exemplos Prontos Pra Copiar:** `plugins/example/flags.js` E `vip.js`.

---

## 2. ⭐ O PADRÃO DE STRING (Regra Mais Importante)

O Bot Tem Um Padrão Inconfundível De Escrita. **Aplique Sempre Em Qualquer String, Mensagem, Comentário Ou Resposta Do Bot:**

> **"Esse É O Padrão, De String, Com Letras Grandes No Inicio"**

**Cada Palavra Deve Começar Com LETRA GRANDE (MAIÚSCULA)** — Não É Só A 
Primeira Letra Da Frase. Conectivos E Palavras Pequenas ("De", "Do", "Da",
"Pra", "Em", "Um") Também Seguem A Regra Quando Dentro De Uma String De Resposta.

- ✅ `"Olá, Seja Bem Vindo Ao Bot"` — Toda Palavra Com Letra Grande.
- ✅ `"Lista De Comandos"`, `"Sistema De Níveis"`.
- ❌ `"Olá, seja bem vindo ao bot"` — Só A Primeira Letra Grande (Errado).
- ❌ `"comando indisponível"` — Nada De Letra Grande (Errado).

**O Bot É Só Em Português: Todos Os Textos São Escritos Direto No Código, Seguindo Esse Padrão De Letras Grandes.**

---

## 3. Estilo De Código

- **4 Espaços Por Nível De indentação**.
- **JS Moderno E Simples:** `async/await`, `const`/`let`, Template Literals
  Com Backtick. Nada De Classes Desnecessárias.
- Nomes De Arquivo/Variável Em **camelCase**. Classes Em **PascalCase**.
  Constantes Em **UPPER_SNAKE_CASE**.
- Comentários Em **pt-BR**, Curtos E Diretos Ao Ponto. Explique Só O Que Não
  Fica Óbvio — Nunca Crie Textos Longos Ou "Justificativas" De Código.

---

## 4. Como Criar Um Plugin Novo

Crie O Arquivo `plugins/<categoria>/<nome>.js`. Copie De 
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

O `run` Recebe `m` (a mensagem) e um `ctx` com tudo:
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

- **Comentários De Código:** Curto E Objetivo, Explicando Apenas O Que Não Fica
  Óbvio. **Evite** Explicações Longas, "Justificativas" De Porquê Ou Comentários
  Que Repetem O Que O Código Já Mostra.
- **Código Autoexplicativo Primeiro:** Se Precisou Escrever Muito Pra Explicar,
  É Sinal De Que O Código Esteja Complicado — Prefira Refatorar (Nomes Claros,
  Funções Menores) A Comentar Muito.
- **JSDoc:** Curto E Direto. Só `@param` E `@returns` Simples Quando Fizer
  Sentido. Nada De Textos Grandes "Decorando" A Documentação.
- **Código Complexo:** Só Nessas Situações Vale Usar `@description` (Ou Um
  Comentário Maior) Com Uma Explicação Rápida Do Que Acontece E Por Quê.
  Complexidade Pede Explicação, Mas Continue Objetivo.
- **Mudanças Pequenas Em Código Já Existente** Não Precisam De JSDoc Novo —
  Siga O Que Já Está Ali. Use O Bom Senso.

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
