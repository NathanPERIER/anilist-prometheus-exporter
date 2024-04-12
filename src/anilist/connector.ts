import { requester } from './requester.js';
import { anime_query, authenticated_user_query, manga_query, tags_query } from './queries.js';
import { ApiResult, api_ok, api_err } from './datastruct/api_status.js';
import { AuthenticatedUser } from './datastruct/user.js';
import { Tag } from './datastruct/tag.js';
import { AnimeDTO, AnimeListDTO } from './datastruct/dto/anime.js';
import { MangaDTO, MangaListDTO } from './datastruct/dto/manga.js';
import { read_anime_lists, read_manga_lists } from './datastruct/dto/deserialize.js';


export class AnilistConnector {

    private constructor(private user: AuthenticatedUser) { }

    public static async init(): Promise<ApiResult<AnilistConnector>> {
        console.debug('Initialising connector and requesting user data');
        const rsp = await requester.query(authenticated_user_query);
        if(!rsp.ok) {
            return api_err(rsp.status);
        }
        const user_data = rsp.data['Viewer'];
        return api_ok(new AnilistConnector({
            user_id: user_data['id'],
            username: user_data['name'],
            unread_notifs: user_data['unreadNotificationCount']
        }));
    }

    public get_user(): AuthenticatedUser {
        return this.user;
    }

    public async get_tags(): Promise<ApiResult<Tag[]>> {
        console.debug('Requesting tags data');
        const rsp = await requester.query(tags_query);
        if(!rsp.ok) {
            return api_err(rsp.status);
        }
        const tags = rsp.data['MediaTagCollection'];
        return api_ok(tags.map((tag_data: any) => {
            return {
                tag_id: tag_data['id'],
                name: tag_data['name'],
                desc: tag_data['description'],
                category: tag_data['category'],
                adult: tag_data['isAdult']
            };
        }));
    }

    public async get_animes(): Promise<ApiResult<{ 'animes': Map<string, AnimeDTO>, 'anime_lists': Map<string, AnimeListDTO> }>> {
        console.debug('Requesting anime data');
        let chunk = 1;
        let has_next_chunk = true;
        let animes = new Map<string, AnimeDTO>();
        let anime_lists = new Map<string, AnimeListDTO>();
        while(has_next_chunk) {
            let rsp = await requester.query(anime_query, {'user_id': this.user.user_id, 'chunk': chunk});
            if(!rsp.ok) {
                return api_err(rsp.status);
            }
            let data = rsp.data['MediaListCollection'];
            read_anime_lists(anime_lists, animes, data['lists']);
            has_next_chunk = data['hasNextChunk'];
            chunk++;
        }
        return api_ok({ 'animes': animes, 'anime_lists': anime_lists });
    }

    public async get_mangas(): Promise<ApiResult<{ 'mangas': Map<string, MangaDTO>, 'manga_lists': Map<string, MangaListDTO> }>> {
        console.debug('Requesting manga data');
        let chunk = 1;
        let has_next_chunk = true;
        let mangas = new Map<string, MangaDTO>();
        let manga_lists = new Map<string, MangaListDTO>();
        while(has_next_chunk) {
            let rsp = await requester.query(manga_query, {'user_id': this.user.user_id, 'chunk': chunk});
            if(!rsp.ok) {
                return api_err(rsp.status);
            }
            let data = rsp.data['MediaListCollection'];
            read_manga_lists(manga_lists, mangas, data['lists']);
            has_next_chunk = data['hasNextChunk'];
            chunk++;
        }
        return api_ok({ 'mangas': mangas, 'manga_lists': manga_lists });
    }

}
