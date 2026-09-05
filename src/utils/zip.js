/**
 * Teste De Criador De .zip Bem Simples, Sem Nenhuma Dependência Externa (Só `Buffer`
 * Puro Do Node). Usa Só O Método "STORE" (Sem Compressão) Os Arquivos Que
 * A Gente Zipa Aqui (JSON De Banco, config.json, Credenciais De Sessão) São
 * Pequenos, Então Não Compensa A Complexidade De Implementar Deflate Na Mão.
 * O .zip Gerado É Um Arquivo PKZIP Válido, Abre Normal Em Qualquer Programa.
 *
 * Baseado Na Especificação Do Formato ZIP (Local File Header + Central
 * Directory + End Of Central Directory).
 */

// Tabela De CRC-32 (Necessária No Header De Cada Arquivo Dentro Do .zip)
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buffer.length; i++) {
        crc = CRC_TABLE[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Converte A Hora Atual Pro Formato De Data/Hora Do MS-DOS Que O Zip Usa.
function dosDateTime(date = new Date()) {
    const dosTime = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((date.getSeconds() / 2) & 0x1F);
    const dosDate = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0xF) << 5) | (date.getDate() & 0x1F);
    return {
        dosTime,
        dosDate
    };
}

/**
 * Monta Um Buffer .zip A Partir De Uma Lista De Arquivos Em Memória.
 * @param {{ name: string, data: Buffer }[]} files - `name` É O Caminho Dentro Do Zip (Ex: "database/global.json").
 * @returns {Buffer}
 */
export function createZip(files) {
    const {
        dosTime,
        dosDate
    } = dosDateTime();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const file of files) {
        const nameBuf = Buffer.from(file.name, "utf-8");
        const data = file.data;
        const crc = crc32(data);

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0); // Assinatura Local File Header
        localHeader.writeUInt16LE(20, 4); // Versão Mínima
        localHeader.writeUInt16LE(0, 6); // Flags
        localHeader.writeUInt16LE(0, 8); // Método (0 = STORE, Sem Compressão)
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(data.length, 18); // Tamanho Comprimido (= Original No STORE)
        localHeader.writeUInt32LE(data.length, 22); // Tamanho Original
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28); // Tamanho Do "Extra"

        localParts.push(localHeader, nameBuf, data);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0); // Assinatura Central Directory
        centralHeader.writeUInt16LE(20, 4); // Versão Que Fez O Zip
        centralHeader.writeUInt16LE(20, 6); // Versão Mínima
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(data.length, 20);
        centralHeader.writeUInt32LE(data.length, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30); // Extra
        centralHeader.writeUInt16LE(0, 32); // Comentário
        centralHeader.writeUInt16LE(0, 34); // Disco Inicial
        centralHeader.writeUInt16LE(0, 36); // Atributos Internos
        centralHeader.writeUInt32LE(0, 38); // Atributos Externos
        centralHeader.writeUInt32LE(offset, 42); // Offset Do Local Header Desse Arquivo

        centralParts.push(centralHeader, nameBuf);

        offset += localHeader.length + nameBuf.length + data.length;
    }

    const centralDirStart = offset;
    const centralDirBuffer = Buffer.concat(centralParts);

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); // Assinatura End Of Central Directory
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(files.length, 8); // Nº De Arquivos Nesse Disco
    end.writeUInt16LE(files.length, 10); // Nº Total De Arquivos
    end.writeUInt32LE(centralDirBuffer.length, 12); // Tamanho Do Central Directory
    end.writeUInt32LE(centralDirStart, 16); // Offset Do Central Directory
    end.writeUInt16LE(0, 20); // Tamanho Do Comentário

    return Buffer.concat([...localParts, centralDirBuffer, end]);
}