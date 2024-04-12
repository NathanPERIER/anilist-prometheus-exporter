
const defaults: {[name: string]: string} = {
	'ALPE_REQUIRE_AUTHENTICATION': 'false',
	'ALPE_CACHE_TIMEOUT_SEC': '3300',            // 55 minutes
	'ALPE_DATA_DIR': '.',
	'ALPE_TOKENS_FILE': './tokens.json',
	'ALPE_PORT': '8080'
}

function getEnv(name: string): string {
	if(name in process.env) {
		return process.env[name] as string;
	}
	if(name in defaults) {
		return defaults[name];
	}
	throw Error("No value provided for environment variable " + name);
}

function get_env_uint(name: string): number {
	let repr = getEnv(name);
	let res = Number(repr);
	if(Number.isNaN(res) || !Number.isFinite(res) || !Number.isInteger(res) || res < 0) {
		throw Error("Bad unsigned integer provided for environment variable " + name);
	}
	return res;
}


export const REQUIRE_AUTHENTICATION = (getEnv('ALPE_REQUIRE_AUTHENTICATION') === 'true');
export const CLIENT_ID              = getEnv('ALPE_ANILIST_CLIENT_ID')
export const CLIENT_SECRET          = getEnv('ALPE_ANILIST_CLIENT_SECRET')
export const CACHE_TIMEOUT_SEC      = get_env_uint('ALPE_CACHE_TIMEOUT_SEC');
export const DATA_DIRECTORY         = getEnv('ALPE_DATA_DIR');
export const TOKENS_FILE            = getEnv('ALPE_TOKENS_FILE');
export const PORT                   = get_env_uint('ALPE_PORT');

export function get_auth_code() { return getEnv('ALPE_ANILIST_AUTH_CODE'); }
