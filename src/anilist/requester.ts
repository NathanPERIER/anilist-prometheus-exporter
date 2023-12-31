import { TOKENS_FILE, getEnv } from '../utils/env.js';
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

export class AnilistRequester {

    private tokens!: AnilistTokens;
    private requests_quota: number;
    private last_request_time: number;

    private constructor() {
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

    private async auth(client_id: string, client_secret: string, auth_code: string) {
        let response = await axios.post('https://anilist.co/api/v2/oauth/token', {
            grant_type: 'authorization_code',
            client_id: client_id,
            client_secret: client_secret,
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
        console.log("Authenticated successfully, token valid until " + (new Date(this.tokens.valid_until * 1000)).toLocaleString('en-UK'));
        await async_fs.writeFile(TOKENS_FILE, JSON.stringify(this.tokens), { encoding: 'utf-8' });
    }

    public static async init(): Promise<AnilistRequester> {
        let res = new AnilistRequester();
        if(await res.try_load_token()) {
            if(res.check_token_validity()) {
                console.log('AniList token successfully retrieved from file with some validity left');
            } else {
                console.warn('AniList token expired, will attempt to refresh it');
                res.refresh_token();
            }
        } else {
            console.warn('No saved authentication token, will attempt to obtain one');
            res.auth(getEnv('ALPE_ANILIST_CLIENT_ID'), getEnv('ALPE_ANILIST_CLIENT_SECRET'), getEnv('ALPE_ANILIST_AUTH_CODE'));
        }
        return res;
    }

    private check_token_validity() {
        return this.tokens.valid_until > Math.floor(Date.now() / 1000);
    }

    private refresh_token() {
        // TODO
    }

    public async query(query: string, variables: {[key: string]: string | number | boolean} = {}): Promise<{ [key: string]: any }> {
        let nb_retries = 0;
        // TODO :
        //  - Check for token validity => refresh ?
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
                return response.data['data'];
            }
            if(response.status === 429) {
                console.warn("Exceeded request quota");
                console.debug("Retry-After: " + response.headers['retry-after']);
                const retry_after = Number(response.headers['retry-after']);
                await sleep(1000 * retry_after);
            } else {
                throw Error("AniList query failed with code " + response.status)
            }
        } while(nb_retries < 5);
        throw Error('AniList query exceeded max number of retries');
    }
}


export const requester = await AnilistRequester.init();

