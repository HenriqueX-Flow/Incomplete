import type { Util } from "@sockets/context.ts";
import type { WASocket } from "baileys";
import type { PluginManager } from "@utils/plugin-manager.ts";

/**
 * Define O Formato Padrão De Um Comando (plugin) Do Bot.
 *
 * Cada Plugin Exporta Uma Funcão `handler` (Ou `default`)
 * Que Segue Esse Formato E Pode Conter Metadados Opcionais
 * Como nome, tags, ajuda e permissões.
 */
interface CommandHandler {
	/**
	 * Executa O Comando Principal.
	 * @param m Mensagem Recebida Encpsulada Pelo Contexto Util.
	 * @param extras Objeto Contendo Infomações E Ultilidades Do Bot.
	 */
    (m: Util, extras: {
        flow?: WASocket,
		cfg?: any;
		pm?: PluginManager;
		args?: string[];
		text?: string;
	}): Promise <any> | void;

	/** Lista De Nomes De Comando Que Avitam Esse Handler. */
    command?: string | string[] | RegExp;

	/** Lista De Tags Usadas Para Categorizar O Comando. */
	tags?: string[];

	/** Texto De Ajuda Exibido No Menu. */
	help?: string[];

	/** Define Se O Comando É Exclusivo Para O Dono Do Bot. */
	owner?: boolean;

	/** Define Se O Comando Requer Ser Usado Em Grupo */
	group?: boolean;

	/** Define Se O Comando Requer Ser Usada No Privado. */
	private?: boolean;

	/** Define Se O Comando Requer Admin Do Grupo. */
	admin?: boolean;

	/** Define Se O Comando Requer Bot Ser Admin. */
	botAdmin?: boolean;

	/** Define Se O Comando Requer Usuário Premiun. */
	premium?: boolean;

	/** Descrição Do Comando */
	desc?: string;
}

interface CommandModule {
    default?: CommandHandler | { handler?: CommandHandler } & Record <string, any>;
	handler?: CommandHandler;
	help?: string[];
	tags?:string[];
	command?:string | string[] | RegExp;
	owner?: boolean;
	group?: boolean;
	private?: boolean;
	admin?: boolean;
	botAdmin?: boolean;
	premium?: boolean;
	desc?: string;
}

export {
	CommandHandler,
	CommandModule
}
