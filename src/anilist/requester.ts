import { TOKENS_FILE, getEnv } from '../utils/env';
import { AxiosResponse, default as axios }  from 'axios';
import * as fs from 'fs';
import * as async_fs from 'fs/promises';



interface AnilistTokens {
    token_type: string,
    access: string,
    refresh: string,
    valid_until: number
}

// TODO :
//  - Check for timestamp validity before
//  - Refresh token
//  - `X-RateLimit-Remaining` (queue of timestamps ?)
//  - 429 + `Retry-After`


const ANILIST_MAX_QUOTA = 90;

export class AnilistRequester {

    private tokens!: AnilistTokens;
    private requests_quota: number;

    private constructor() {
        this.requests_quota = ANILIST_MAX_QUOTA;
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
            throw Error("Anilist authentication failed with code " + response.status);
        }
        this.tokens.token_type = response.data['token_type'];
        this.tokens.access = response.data['access_token'];
        this.tokens.refresh = response.data['refresh_token'];
        this.tokens.valid_until = Math.floor(Date.now() / 1000) + response.data['expires_in'];
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

    public async query(query: string, variables: {[key: string]: string | number | boolean}) {
        let response = await axios.post('https://graphql.anilist.co', {
            'query': query,
            'variables': variables
        }, {
            headers: {
                Authorization: "Bearer " + this.tokens.access,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        // TODO
    }

}


export let requester = AnilistRequester.init();