
const defaults: {[name: string]: string} = {
	'ALPE_REQUIRE_AUTHENTICATION': 'false',
	'ALPE_DATA_DIR': '.',
	'ALPE_TOKENS_FILE': './tokens.json',
	'ALPE_PORT': '8080'
}

export function getEnv(name: string): string {
	if(name in process.env) {
		return process.env[name] as string;
	}
	if(name in defaults) {
		return defaults[name];
	}
	throw Error("No value provided for environment variable " + name);
}

export function get_env_uint(name: string): number {
	let repr = getEnv(name);
	let res = Number(repr);
	if(Number.isNaN(res) || !Number.isFinite(res) || !Number.isInteger(res) || res < 0) {
		throw Error("Bad unsigned integer provided for environment variable " + name);
	}
	return res;
}


export const REQUIRE_AUTHENTICATION = (getEnv('ALPE_REQUIRE_AUTHENTICATION') === 'true');
export const DATA_DIRECTORY         = getEnv('ALPE_DATA_DIR');
export const TOKENS_FILE            = getEnv('ALPE_TOKENS_FILE');
export const PORT                   = get_env_uint('ALPE_PORT');
