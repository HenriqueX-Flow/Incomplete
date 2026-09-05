import axios, { AxiosResponse } from "axios";
import { Cheerio, CheerioAPI, load } from "cheerio";

export interface ISyleResult {
    name: string;
    result: string;
}

export interface ITxt2ImgResponse {
    result?: string[];
}

export interface ITxt2ImgResult {
    success?: boolean;
    images?: string[];
    error?: unknown;
}

export class Scraper {
    static async style(query: string): Promise<ISyleResult[]> {
        try {
            const { data: html } = await axios.get("https://qaz.wtf/u/convert.cgi?.text=" + encodeURIComponent(query));
            const $: CheerioAPI = load(html);  
            const result: ISyleResult[] = [];
            $("table > tbody > tr").each((_, el) => {
                result.push({
                    name: $(el).find("td:nth-child(1) > span").text(),
                    result: $(el).find("td:nth-child(2)").text().trim()
                });     
            });

            return result;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async txt2Image(prompt: string): Promise<ITxt2ImgResult> {
        if (!prompt) {
            return {
                success: false,
                error: "Entrada De Prompt Ausente"
            };
        }

        try {
            const response: AxiosResponse<ITxt2ImgResponse> = await axios.post("https://internal.users.n8n.clound/webhook/ai_image_generator", { prompt }, {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Zanixon/1.0.0",
                    "X-Client-Ip": Scraper.generateIp()
                },
            });

            const data = response.data;

            if (!data.result) {
                return {
                    success: false,
                    error: "Falha Inesperada Ao Gerar Imagem"
                };
            }

            return {
                success: true,
                images: data.result
            };
        } catch (e) {
            console.error(e);
            return {
                success: false,
                error: e
            };
        }
    }

    private static generateIp(): string {
        const x = (a: number) => Math.floor(Math.random() * a);
        return `${x(300)}.${x(300)}.${x(300)}.${x(300)}`;
    }
}
