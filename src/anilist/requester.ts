import { TOKENS_FILE, CLIENT_ID, CLIENT_SECRET, get_auth_code } from '../utils/env.js';
import { ApiStatus, ApiResult, api_ok, api_err } from './datastruct/api_status.js';
import axios from 'axios';
import fs from 'fs';
import async_fs from 'fs/promises';



interface AnilistTokens {
    token_type: string,
    access: string,
    refresh: string,
    valid_until: number
}

function sleep(time_ms: number): Promise<void> {
    return new Promise((resolve) => { setTimeout(resolve, time_ms); });
}


const ANILIST_MAX_QUOTA = 90;
const ANILIST_OAUTH_URL = 'https://anilist.co/api/v2/oauth/token';

export class AnilistRequester {

    private tokens!: AnilistTokens;

    private readonly client_id: string;
    private readonly client_secret: string;

    private requests_quota: number;
    private last_request_time: number;

    private constructor(client_id: string, client_secret: string) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.requests_quota = ANILIST_MAX_QUOTA;
        this.last_request_time = 0;
    }

    private async try_load_token(): Promise<boolean> {
        if(fs.existsSync(TOKENS_FILE)) {
            const raw_data = await async_fs.readFile(TOKENS_FILE, 'utf8');
            if(raw_data.trim().length > 0) {
                this.tokens = JSON.parse(raw_data);
                return true;
            }
        }
        return false;
    }

    private async auth(auth_code: string) {
        let response = await axios.post(ANILIST_OAUTH_URL, {
            grant_type: 'authorization_code',
            client_id: this.client_id,
            client_secret: this.client_secret,
            redirect_uri: 'https://anilist.co/api/v2/oauth/pin',
            code: auth_code
        }, {
            headers: {
                Accept: 'application/json'
            },
            validateStatus: (_status: number) => { return true; }
        });
        if(response.status !== 200) {
            console.error(response);
            throw Error("AniList authentication failed with code " + response.status);
        }
        this.tokens = {
            token_type: response.data['token_type'],
            access: response.data['access_token'],
            refresh: response.data['refresh_token'],
            valid_until: Math.floor(Date.now() / 1000) + response.data['expires_in']
        };
        console.log("Authenticated successfully");
        await this.write_tokens();
    }

    public static async init(): Promise<AnilistRequester> {
        let res = new AnilistRequester(CLIENT_ID, CLIENT_SECRET);
        if(await res.try_load_token()) {
            if(res.check_token_validity()) {
                console.log('AniList token successfully retrieved from file with some validity left');
            } else {
                console.warn('AniList token expired, will attempt to refresh it');
                res.refresh_token();
            }
        } else {
            console.warn('No saved authentication token, will attempt to obtain one');
            res.auth(get_auth_code());
        }
        return res;
    }

    private check_token_validity() {
        return this.tokens.valid_until > Math.floor(Date.now() / 1000);
    }

    private async write_tokens() {
        await async_fs.writeFile(TOKENS_FILE, JSON.stringify(this.tokens), { encoding: 'utf-8' });
        console.log("Token written to disk, valid until " + (new Date(this.tokens.valid_until * 1000)).toLocaleString('en-UK'));
    }

    private async refresh_token() {
        console.log('Token refresh required');
        let response = await axios.post(ANILIST_OAUTH_URL, {
            grant_type: 'refresh_token',
            client_id: this.client_id,
            client_secret: this.client_secret,
            refresh_token: this.tokens.refresh
        }, {
            headers: {
                Accept: 'application/json'
            },
            validateStatus: (_status: number) => { return true; }
        });
        if(response.status !== 200) {
            console.error(response);
            throw Error("AniList token refresh failed with code " + response.status);
        }
        this.tokens.access = response.data['access_token'];
        this.tokens.valid_until = Math.floor(Date.now() / 1000) + response.data['expires_in'];
        if('refresh_token' in response.data) {
            this.tokens.refresh = response.data['refresh_token'];
        }
        console.log("Tokens refreshed successfully");
        await this.write_tokens();
    }

    public async query(query: string, variables: {[key: string]: string | number | boolean} = {}): Promise<ApiResult<{ [key: string]: any }>> {
        let nb_retries = 0;
        let status = ApiStatus.AUTH_ERROR;
        try {
            if(!this.check_token_validity()) {
                await this.refresh_token();
            }
            if(this.requests_quota == 0) {
                if(Date.now() - this.last_request_time < 60 * 1000) {
                    console.info("Request quota reached 0, pause for one minute before making any further request");
                    await sleep(60 * 1000); // TODO : there may be a better way if we keep the times at which some requests are made
                } else {
                    this.requests_quota = ANILIST_MAX_QUOTA;
                }
            }
            do {
                nb_retries++;
                this.last_request_time = Date.now();
                let response = await axios.post('https://graphql.anilist.co', {
                    'query': query,
                    'variables': variables
                }, {
                    headers: {
                        Authorization: "Bearer " + this.tokens.access,
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    validateStatus: (_status: number) => { return true; }
                });
                if(response.status === 200) {
                    // console.debug("X-RateLimit-Remaining: " + response.headers['x-ratelimit-remaining']);
                    this.requests_quota = Number(response.headers['x-ratelimit-remaining']);
                    status = ApiStatus.OK;
                    return api_ok(response.data['data']);
                }
                if(response.status === 429) {
                    console.warn("Exceeded request quota");
                    console.debug("Retry-After: " + response.headers['retry-after']);
                    const retry_after = Number(response.headers['retry-after']);
                    await sleep(1000 * retry_after + 100);
                    status = ApiStatus.TIMEOUT;
                } else if(response.status === 500 && nb_retries < 3) {
                    console.info("Server error, attempt retry");
                    status = ApiStatus.HTTP_ERROR;
                } else {
                    if(response.status === 401 || response.status === 403) {
                        status = ApiStatus.AUTH_ERROR;
                    } else {
                        status = ApiStatus.HTTP_ERROR;
                    }
                    break;
                }
            } while(nb_retries < 5);
            console.warn('AniList query exceeded max number of retries');
        } catch(err) {
            if(err instanceof axios.AxiosError) {
                console.warn(`Got error from Axios during a request : ${err.message}`);
            } else {
                console.warn(`Got unknown error of type ${typeof err} during a request`);
            }
            status = ApiStatus.UNREACHABLE;
        }
        return api_err(status);
    }
}


export const requester = await AnilistRequester.init();

