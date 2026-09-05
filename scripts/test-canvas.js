// Rode Com: node scripts/test-canvas.js
// Só Testa Se O @napi-rs/canvas Consegue Criar E Desenhar Num Canvas De Verdade
// No Seu Celular. Não Depende Do Resto Do Bot.
import fs from "fs";

try {
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f5c542";
    ctx.fillRect(0, 0, 200, 100);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./teste-canvas.png", buffer);
    console.log("(✅) FUNCIONOU. Gerou ./teste-canvas.png Abra A Imagem Pra Conferir.");
    console.log("   O Sistema De Nível Vai Usar O @napi-rs/canvas Normalmente.");
} catch (e) {
    console.log("(❌) @napi-rs/canvas NÃO Funcionou Nesse Termux.");
    console.log("   Erro:", e.message);
    console.log("   Sem Problema, O Bot Vai Usar O Gerador Básico Via Ffmpeg Automaticamente.");
}