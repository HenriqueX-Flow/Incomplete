/**
 * @typedef {Object} MixedButton
 * @property {string} name
 * @property {Record<string, any>|string} buttonParamsJson
 */

/**
 * Botão De Resposta Rápida (Dispara Um Comando Ao Ser Clicado).
 * @param {string} displayText - Texto Do Botão
 * @param {string} id - Texto/Comando Que Volta Como m.text Ao Clicar
 * @returns {MixedButton}
 */
export function quickReplyButton(displayText, id) {
    return {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({ 
            display_text: displayText, id 
        })
    }
}

/**
 * Botão Que Abre Um Link No Navegador.
 * @param {string} title
 * @param {string} url
 * @returns {MixedButton}
 */
export function urlButton(title, url) {
    return {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
            display_text: title,
            url,
            merchant_url: url
        })
    }
}

/**
 * Botão Que Copia Um Texto Para A Área De Transferência Do Celular.
 * @param {string} displayText - Texto Que Aparece No Botão (ex: "Copiar Código")
 * @param {string} copyText - O Texto Que Será Copiado Ao Clicar
 * @returns {MixedButton}
 */
export function copyButton(displayText, copyText) {
    return {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
            display_text: displayText,
            copy_code: copyText
        })
    }
}


/**
 * @typedef {Object} ListRow
 * @property {string} title
 * @property {string} [description]
 * @property {string} id - O Que Volta Em m.text Ao Selecionar
 */

/**
 * @typedef {Object} ListSection
 * @property {string} title
 * @property {ListRow[]} rows
 */

/**
 * Botão De Lista (Menu Suspenso Com Seções).
 * @param {string} buttonTitle - Texto Do Botão Que Abre A Lista
 * @param {ListSection[]} sections
 * @returns {MixedButton}
 */
export function listButton(buttonTitle, sections) {
    return {
        name: "single_select",
        buttonParamsJson: JSON.stringify({ title: buttonTitle, sections })
    }
}

/**
 * Botão Invisível (Necessário Para O Truque Do Layout Misto/Catálogo).
 * @returns {MixedButton}
 */
export function hiddenButton() {
    return {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            has_multiple_buttons: true
        })
    }
}

/**
 * Botão De Catálogo/Produto (Abre Um Produto Da Loja).
 * @param {string} displayText - Texto Do Botão
 * @param {string} phoneNumber - Número Da Conta Business (Ex: "558888205721")
 * @param {string} productId - ID Do Produto No Catálogo
 * @returns {MixedButton}
 */
export function catalogButton(displayText, phoneNumber, productId) {
    return {
        name: "automated_greeting_message_view_catalog",
        buttonParamsJson: JSON.stringify({
            display_text: displayText,
            business_phone_number: phoneNumber,
            catalog_product_id: productId
        })
    }
}
