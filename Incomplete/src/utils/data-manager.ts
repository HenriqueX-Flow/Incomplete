import fs from "fs";
import path from "path";

const dataPath = path.resolve(process.cwd(), "data.json");

function readData() {
    if (!fs.existsSync(dataPath)) {
        const initial = {
            config: {
				prefix: "!",
                multi_prefix: false,
				no_prefix: false,
				auto_read_msg: true,
				auto_type_msg: true,
				public: true,
				image: "https://files.catbox.moe/xlr5d0.jpg",
				owner: "49414169206835@lid",
				menu_type: 3
			},
			premium: {},
		};
		fs.writeFileSync(dataPath, JSON.stringify(initial));
		return initial;
	}

	try {
		const raw = fs.readFileSync(dataPath, "utf8");
		return JSON.parse(raw);
	} catch {
		return {
			config: {},
			premium: {}
		};
	}
}

function writeData(data: any) {
	fs.writeFileSync(dataPath, JSON.stringify(data));
}

export function readConfig() {
	const data = readData();
	return data.config;
}

export function writeConfig(newConfig: any) {
    const data = readData();
	data.config = {
		...data.config,
		...newConfig
	};
    writeData(data);
}

export function getMenuType(): number {
    const data = readData();
    return data.config.menu_type ?? 3;
}

export function setMenuType(type: number) {
    const data = readData();
    data.config.menu_type = type;
    writeData(data);
}

export function addPremium(jid: string, durationMs: number, addedBy: string) {
    const data = readData();
	const now = Date.now();
	data.premium[jid] = {
		expire: now + durationMs,
		addedBy,
	};
	writeData(data);
	return data.premium[jid];
}

export function removePremium(jid: string) {
	const data = readData();
	delete data.premium[jid];
	writeData(data);
}

export function isPremium(jid: string) {
	const data = readData();
	const user = data.premium[jid];
	if (!user) return false;
	if (Date.now() > user.expire) {
		delete data.premium[jid];
		writeData(data);
		return false;
	}
	return true;
}

export function getPremiumExpire(jid: string) {
	const data = readData();
	return data.premium[jid]?.expire || null;
}

export function transferPremium(from: string, to: string) {
	const data = readData();
	const donor = data.premium[from];
	if (!donor) return false;
    data.premium[to] = {
		...donor
	};
	delete data.premium[from];
	writeData(data);
	return true;
}
