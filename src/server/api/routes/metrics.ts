import app from '../../core.js';
import { AnimeList } from '../../../anilist/datastruct/anime.js';
import { MangaList } from '../../../anilist/datastruct/manga.js';
import { AnilistConnector } from '../../../anilist/connector.js';
import { AuthenticatedUser } from '../../../anilist/datastruct/user.js';
import { AnimeDTO, AnimeListDTO } from '../../../anilist/datastruct/dto/anime.js';
import { MangaDTO, MangaListDTO } from '../../../anilist/datastruct/dto/manga.js';
import { CACHE_TIMEOUT_SEC, DATA_DIRECTORY } from '../../../utils/env.js';
import { dump_json, load_json } from '../../../utils/io.js';
import path from 'path';

const USER_FILE_PATH = path.join(DATA_DIRECTORY, 'user.json');
const TAGS_FILE_PATH = path.join(DATA_DIRECTORY, 'tags.json');
const ANIMES_FILE_PATH      = path.join(DATA_DIRECTORY, 'animes.json');
const ANIME_LISTS_FILE_PATH = path.join(DATA_DIRECTORY, 'anime_lists.json');
const MANGAS_FILE_PATH      = path.join(DATA_DIRECTORY, 'mangas.json');
const MANGA_LISTS_FILE_PATH = path.join(DATA_DIRECTORY, 'manga_lists.json');



let data_last_loaded = 0;

async function load_data(): Promise<[AuthenticatedUser, Map<string, AnimeList>, Map<string, MangaList>]> {
    let user_data: AuthenticatedUser;
    let animes:      Map<string, AnimeDTO>;
    let anime_lists: Map<string, AnimeListDTO>;
    let mangas:      Map<string, MangaDTO>;
    let manga_lists: Map<string, MangaListDTO>;
    if(Date.now() - data_last_loaded > CACHE_TIMEOUT_SEC) {
        console.log('Loading data from the API');

        const connector = await AnilistConnector.init();

        user_data = connector.get_user();
        await dump_json(USER_FILE_PATH, user_data);

        const tags_data = await connector.get_tags();
        await dump_json(TAGS_FILE_PATH, tags_data);
        
        const anime_data = await connector.get_animes();
        animes      = anime_data.animes;
        anime_lists = anime_data.anime_lists;
        await dump_json(ANIMES_FILE_PATH,      Object.fromEntries(animes));
        await dump_json(ANIME_LISTS_FILE_PATH, Object.fromEntries(anime_lists));
        
        const manga_data = await connector.get_mangas();
        mangas      = manga_data.mangas;
        manga_lists = manga_data.manga_lists;
        await dump_json(MANGAS_FILE_PATH,      Object.fromEntries(mangas));
        await dump_json(MANGA_LISTS_FILE_PATH, Object.fromEntries(manga_lists));

        data_last_loaded = Date.now();
    } else {
        console.log('Reloading data from the disc');
        
        user_data = await load_json(USER_FILE_PATH);
        animes      = new Map<string, AnimeDTO>(Object.entries(await load_json(ANIMES_FILE_PATH)))
        anime_lists = new Map<string, AnimeListDTO>(Object.entries(await load_json(ANIME_LISTS_FILE_PATH)))
        mangas      = new Map<string, MangaDTO>(Object.entries(await load_json(MANGAS_FILE_PATH)))
        manga_lists = new Map<string, MangaListDTO>(Object.entries(await load_json(MANGA_LISTS_FILE_PATH)))
    }
    const anime_data = new Map<string, AnimeList>(Array.from(anime_lists.entries()).map(val => {
        return [val[0], new AnimeList(val[1], animes)];
    }));
    const manga_data = new Map<string, MangaList>(Array.from(manga_lists.entries()).map(val => {
        return [val[0], new MangaList(val[1], mangas)];
    }));
    return [user_data, anime_data, manga_data];
}



app.get('/test', async (_req, res) => {

    let [user_data, anime_data, manga_data] = await load_data();

    // TODO compute metrics

    res.type('application/json');
    res.send(user_data);
});
