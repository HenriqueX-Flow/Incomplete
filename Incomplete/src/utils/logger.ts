import pkg from "@mengkodingan/consolefy";
import chalk from "chalk";
import Cfonts from "cfonts";
import os from "os";

const {
	Colors,
	Consolefy
} = pkg;

function showBanner() {
	Cfonts.say("Flow", {
		font: "3d",
		align: "center",
		colors: ["gray", "white"],
		background: "transparent",
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		maxLength: "0",
		gradient: ["white", "gray"],
		env: "node"
	});

	log.divider();
	console.log(chalk.gray(`📎 GitHub: @HenriqueX-Flow\n💬 Projeto: Incomplete Bot`))
	log.divider();
}

function showSystemInfo() {
	function runTime(seconds: number): string {
		const d = Math.floor(seconds / (3600 * 24));
		const h = Math.floor((seconds % (3600 * 24)) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${d}d ${h}h ${m}m ${s}s`
	}

	console.log(chalk.greenBright(chalk.underline("ㅤㅤㅤIncompleteㅤㅤㅤ")));
	log.divider();
	const footer = os.platform() === "android" ? "INFO DO DISPOSITIVO" : "INFO DA VPS";

	console.log(chalk.italic(footer));
	console.log(chalk.white(` Plataforma   : ${os.platform()}`));
	console.log(chalk.white(` Total RAM    : ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`));
	console.log(chalk.white(` RAM Usada    : ${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(1)} GB`));
	console.log(chalk.white(` Total CPU    : ${os.cpus().length} Cores`));
	console.log(chalk.white(` Execução     : ${runTime(os.uptime())}`));
	log.divider();
}

const print = new Consolefy({
	prefixes: {
		warn: "Incomplete | Warn",
		success: "Incomplete | Success",
		error: "Incomplete | Error",
		info: "Incomplete | Info",
	},
	theme: {
		warn: (text) => Colors.bgYellow(Colors.black(text)),
		success: (text) => Colors.bgGreen(Colors.black(text)),
		error: (text) => Colors.bgRed(Colors.black(text)),
		info: (text) => Colors.bgBlue(Colors.black(text))
	},
	format: "{prefix}{tag} {message}",
	tag: "Bot"
});

const log = {
	info: (msg: string | string[]) => print.info(msg),
    warn: (msg: string | string[]) => print.warn(msg),
	success: (msg: string | string[]) => print.success(msg),
	error: (msg: string | string[]) => print.error(msg),
	underline: (msg: string | string[]) => console.log(chalk.underline(msg)),
	divider: () => console.log(chalk.gray("───────────────────────────────────────"))
};

export {
	showBanner,
	showSystemInfo,
	log,
	print
};
