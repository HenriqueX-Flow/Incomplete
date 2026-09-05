import fs from "fs";
import path from "path";

const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "font.ttf");
let fontChecked = false;
let fontOk = false;

/**
 * Registra A Fonte Custom Uma Única Vez (Compartilhado Entre renderCanvas
 * E renderImageLevelUp, Pra Não Checar O Disco Toda Hora Nem Duplicar Lógica).
 * @param {any} GlobalFonts - Vem De `await import("@napi-rs/canvas")`
 * @returns {boolean} true Se A Fonte Foi Encontrada E Registrada
 */
function ensureFont(GlobalFonts) {
    if (fontChecked) return fontOk;
    fontChecked = true;
    fontOk = fs.existsSync(FONT_PATH);
    if (fontOk) GlobalFonts.registerFromPath(FONT_PATH, "BotFont");
    return fontOk;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawLightningIcon(ctx, cx, cy, size, color) {
    const s = size / 24;
    ctx.save();
    ctx.translate(cx - 12 * s, cy - 12 * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(3, 14);
    ctx.lineTo(11, 14);
    ctx.lineTo(9, 24);
    ctx.lineTo(21, 9);
    ctx.lineTo(13, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawStarIcon(ctx, cx, cy, size, color) {
    const r = size / 2;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawDot(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawAvatarPlaceholder(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = "#3f4459";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6b7190";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.18, r * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy + r * 1.05, r * 0.62, Math.PI, 0, false);
    ctx.fill();
    ctx.restore();
}

async function drawAvatarWithRing(ctx, loadImage, avatarBuffer, cx, cy, r, ringColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatarBuffer) {
        const image = await loadImage(avatarBuffer);
        ctx.drawImage(image, cx - r, cy - r, r * 2, r * 2);
    } else {
        drawAvatarPlaceholder(ctx, cx, cy, r);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let cut = text;
    while (cut.length > 1 && ctx.measureText(cut + "…").width > maxWidth) {
        cut = cut.slice(0, -1);
    }
    return cut + "…";
}

function drawStatusPill(ctx, x, y, text, dotColor, fontFamily) {
    const paddingX = 18;
    const height = 34;
    ctx.font = `600 15px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;
    const width = paddingX * 2 + 18 + textWidth;

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    ctx.stroke();

    drawDot(ctx, x + paddingX + 5, y + height / 2, 5, dotColor);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d8dae4";
    ctx.fillText(text, x + paddingX + 18, y + height / 2 + 1);
    ctx.textBaseline = "alphabetic";

    return width;
}

function drawStatBox(ctx, { x, y, w, h, icon, accent, label, value, fontFamily }) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.restore();

    const iconCx = x + 30;
    const iconCy = y + h / 2;
    if (icon === "lightning") drawLightningIcon(ctx, iconCx, iconCy, 20, accent);
    else drawStarIcon(ctx, iconCx, iconCy, 20, accent);

    const textX = x + 56;
    ctx.textAlign = "left";
    ctx.fillStyle = "#9aa0b4";
    ctx.font = `600 13px ${fontFamily}`;
    ctx.fillText(label.toUpperCase(), textX, y + h / 2 - 8);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 26px ${fontFamily}`;
    ctx.fillText(fitText(ctx, value, w - (textX - x) - 16), textX, y + h / 2 + 22);
}

/**
 * @typedef {Object} RankCardInput
 * @property {string} name
 * @property {string} [jid] - Usado Só Pra Mostrar "@numero" Embaixo Do Nome
 * @property {number} level
 * @property {number} progress - De 0 A 1 (Progresso Pro Próximo Nível)
 * @property {string} [xpLabel] - Texto Livre Pra Mostrar Ao Lado Da Barra (Ex: "1.2k/2k XP"). Se Omitido, Usa Porcentagem.
 * @property {boolean} [premium] - Mostra A Pill De Status Como Premium Ou Free
 * @property {number} [limit] - Usos Restantes, Pra Caixa De LIMITE
 * @property {number} [limitMax] - Limite Máximo (Pra Mostrar "x/y")
 * @property {string} [botName] - Nome Do Bot, Vai No Rodapé
 * @property {Buffer|null} avatarBuffer - Buffer Da Foto De Perfil, Ou null
 */

/**
 * Gera O Banner De Perfil Em PNG Usando @napi-rs/canvas. Se A Lib Não
 * Estiver Disponível Essa Função Lança Um Erro, Quem Chama (src/canvas/rankCard.js)
 * Cai Pro Gerador Via Ffmpeg.
 * @param {RankCardInput} input
 * @returns {Promise<Buffer>}
 */
export async function renderCanvas({
    name,
    jid,
    level,
    progress,
    xpLabel,
    premium,
    limit,
    limitMax,
    botName,
    avatarBuffer
}) {
    const {
        createCanvas,
        loadImage,
        GlobalFonts
    } = await import("@napi-rs/canvas");
    const hasFont = ensureFont(GlobalFonts);
    const fontFamily = hasFont ? "BotFont" : "sans-serif";

    const width = 1000;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.save();
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.clip();

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#161b30");
    bg.addColorStop(1, "#0b0e1c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(110, 177, 150, 0.05)";
    ctx.beginPath();
    ctx.arc(width - 80, 40, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(120, 140, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(width - 220, height - 20, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.beginPath();
    ctx.arc(120, height + 40, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 27);
    ctx.stroke();
    ctx.restore();

    const avatarR = 110;
    const avatarCx = 60 + avatarR;
    const avatarCy = height / 2;
    await drawAvatarWithRing(ctx, loadImage, avatarBuffer, avatarCx, avatarCy, avatarR, "#6eb196");

    const contentX = 60 + avatarR * 2 + 50;
    const contentW = width - contentX - 50;

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 38px ${fontFamily}`;
    ctx.fillText(fitText(ctx, name || "Desconhecido", contentW), contentX, 96);

    if (jid) {
        ctx.fillStyle = "#7d8299";
        ctx.font = `18px ${fontFamily}`;
        ctx.fillText(`@${jid.split("@")[0]}`, contentX, 124);
    }

    const pillY = 144;
    if (premium) {
        drawStatusPill(ctx, contentX, pillY, "PREMIUM", "#f5c542", fontFamily);
    } else {
        drawStatusPill(ctx, contentX, pillY, "FREE USER", "#7d8299", fontFamily);
    }

    const boxY = 206;
    const boxH = 78;
    const gap = 18;
    const boxW = (contentW - gap) / 2;

    if (limit !== undefined) {
        drawStatBox(ctx, {
            x: contentX,
            y: boxY,
            w: boxW,
            h: boxH,
            icon: "lightning",
            accent: "#e0555a",
            label: "Limite",
            value: limitMax ? `${limit}/${limitMax}` : `${limit}`,
            fontFamily
        });
    }

    drawStatBox(ctx, {
        x: contentX + (limit !== undefined ? boxW + gap : 0),
        y: boxY,
        w: limit !== undefined ? boxW : contentW,
        h: boxH,
        icon: "star",
        accent: "#6eb196",
        label: "Nível",
        value: `Lv ${level}`,
        fontFamily
    });

    const barY = boxY + boxH + 30;
    const barH = 20;

    ctx.fillStyle = "#9aa0b4";
    ctx.font = `600 13px ${fontFamily}`;
    ctx.fillText("PROGRESSO PRO PRÓXIMO NÍVEL", contentX, barY - 8);

    ctx.textAlign = "right";
    ctx.fillText(xpLabel || `${Math.round((progress || 0) * 100)}%`, contentX + contentW, barY - 8);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    roundRect(ctx, contentX, barY, contentW, barH, barH / 2);
    ctx.fill();

    const frac = Math.min(Math.max(progress || 0, 0), 1);
    if (frac > 0) {
        const grad = ctx.createLinearGradient(contentX, 0, contentX + contentW, 0);
        grad.addColorStop(0, "#4d9e7c");
        grad.addColorStop(1, "#6eb196");
        ctx.fillStyle = grad;
        roundRect(ctx, contentX, barY, Math.max(barH, contentW * frac), barH, barH / 2);
        ctx.fill();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.font = `13px ${fontFamily}`;
    ctx.fillText(`${botName || "Incomplete Bot"} • Sistema De Perfil`, width / 2, height - 20);
    ctx.textAlign = "left";

    return canvas.toBuffer("image/png");
}

/**
 * @typedef {Object} LevelUpInput
 * @property {string} name
 * @property {number} oldLevel
 * @property {number} newLevel
 * @property {string} [botName]
 * @property {Buffer|null} avatarBuffer
 */

/**
 * Gera A Imagem De "Subiu De Nível", Mais Festiva Que O Banner Normal.
 * Se Qualquer Coisa Der Errado Aqui, Quem Chama (handler.js) Deve Cair
 * Pra Uma Mensagem De Texto Simples — Essa Função Não Tem Fallback
 * Próprio, Então NUNCA Deve Ser Chamada Sem try/catch Por Fora.
 * @param {LevelUpInput} input
 * @returns {Promise<Buffer>}
 */
export async function renderImageLevelUp({
    avatarBuffer,
    name,
    oldLevel,
    newLevel,
    botName
}) {
    const {
        createCanvas,
        loadImage,
        GlobalFonts
    } = await import("@napi-rs/canvas");
    const hasFont = ensureFont(GlobalFonts);
    const fontFamily = hasFont ? "BotFont" : "sans-serif";

    const width = 900;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.save();
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.clip();

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#1a0b2e");
    bg.addColorStop(1, "#0b132b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 0, 128, 0.06)";
    ctx.beginPath();
    ctx.arc(width * 0.45, height / 2, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 255, 200, 0.04)";
    ctx.beginPath();
    ctx.arc(width * 0.45, height / 2, 190, 0, Math.PI * 2);
    ctx.fill();

    const burstCx = 150;
    const burstCy = height / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14;
        ctx.beginPath();
        ctx.moveTo(burstCx + Math.cos(angle) * 95, burstCy + Math.sin(angle) * 95);
        ctx.lineTo(burstCx + Math.cos(angle) * 180, burstCy + Math.sin(angle) * 180);
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 27);
    ctx.stroke();
    ctx.restore();

    await drawAvatarWithRing(ctx, loadImage, avatarBuffer, 150, height / 2, 85, "#00ffc8");

    const xText = 275;

    drawStarIcon(ctx, xText + 8, 96, 16, "#ff5fa8");
    ctx.textAlign = "left";
    ctx.fillStyle = "#ff5fa8";
    ctx.font = `bold 20px ${fontFamily}`;
    ctx.fillText("PARABÉNS", xText + 26, 102);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 42px ${fontFamily}`;
    ctx.fillText(fitText(ctx, name || "Desconhecido", width - xText - 40), xText, 160);

    ctx.fillStyle = "#a0aec0";
    ctx.font = `19px ${fontFamily}`;
    ctx.fillText("Você Subiu De Nível Continuando A Usar O Bot.", xText, 190);

    const emblemX = xText;
    const emblemY = 240;
    const emblemW = width - xText - 60;
    const emblemH = 130;

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, emblemX, emblemY, emblemW, emblemH, 20);
    ctx.fill();
    ctx.stroke();

    const oldCx = emblemX + 90;
    const midCx = emblemX + emblemW / 2;
    const newCx = emblemX + emblemW - 90;
    const emblemCy = emblemY + emblemH / 2;

    ctx.textAlign = "center";
    ctx.fillStyle = "#7d8299";
    ctx.font = `14px ${fontFamily}`;
    ctx.fillText("NÍVEL ANTERIOR", oldCx, emblemCy - 14);
    ctx.fillStyle = "#c4c8d8";
    ctx.font = `bold 30px ${fontFamily}`;
    ctx.fillText(`${oldLevel}`, oldCx, emblemCy + 22);

    ctx.save();
    ctx.strokeStyle = "#00ffc8";
    ctx.fillStyle = "#00ffc8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(midCx - 22, emblemCy);
    ctx.lineTo(midCx + 12, emblemCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midCx + 22, emblemCy);
    ctx.lineTo(midCx + 8, emblemCy - 8);
    ctx.lineTo(midCx + 8, emblemCy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#00ffc8";
    ctx.font = `14px ${fontFamily}`;
    ctx.fillText("NOVO NÍVEL", newCx, emblemCy - 14);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 38px ${fontFamily}`;
    ctx.fillText(`${newLevel}`, newCx, emblemCy + 26);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.font = `13px ${fontFamily}`;
    ctx.fillText(`${botName || "Incomplete Bot"} • Sistema De Nível`, width / 2, height - 20);
    ctx.textAlign = "left";

    return canvas.toBuffer("image/png");
}
