import app from '../../core.js';
import { AnimeList } from '../../../anilist/datastruct/anime.js';
import { MangaList } from '../../../anilist/datastruct/manga.js';
import { AnilistConnector } from '../../../anilist/connector.js';
import { AuthenticatedUser } from '../../../anilist/datastruct/user.js';
import { AnimeDTO, AnimeListDTO } from '../../../anilist/datastruct/dto/anime.js';
import { MangaDTO, MangaListDTO } from '../../../anilist/datastruct/dto/manga.js';
import { MediaEntryStatus, MediaStatus } from '../../../anilist/datastruct/media.js';
import { CACHE_TIMEOUT_SEC, DATA_DIRECTORY } from '../../../utils/env.js';
import { dump_json, load_json } from '../../../utils/io.js';
import { PrometheusDocument } from '../../../prometheus/builder.js';
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
    if(Date.now() - data_last_loaded > CACHE_TIMEOUT_SEC * 1000) {
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



app.get('/metrics', async (_req, res) => {

    const [user_data, anime_data, manga_data] = await load_data();
    const animes = anime_data.map(val => val.animes).flat();
    const mangas = manga_data.map(val => val.mangas).flat();

    const user_id = user_data.user_id.toString();

    let document = new PrometheusDocument();

    document.add_group('anilist_user', 'User for which the data is exported.', [[{'user_id': user_id, 'username': user_data.username}, 1]]);
    
    document.add_group('anilist_publish_status_name', 'Names for anime/manga publishing status.', Object.keys(MediaStatus).filter(val => isNaN(Number(val))).map(key => [{'publish_status': (<any>MediaStatus)[key].toString(), 'display_name': key.toLowerCase()}, 1]));
    document.add_group('anilist_progress_status_name', 'Names for reading/watching status.', Object.keys(MediaEntryStatus).filter(val => isNaN(Number(val))).map(key => [{'progress_status': (<any>MediaEntryStatus)[key].toString(), 'display_name': key.toLowerCase()}, 1]));

    document.add_group('anilist_user_notification_count', 'Number of unread notifications.', [[{'user_id': user_id}, user_data.unread_notifs]]);
    
    document.add_group('anilist_anime_title', 'Titles associated with anime identifiers.', animes.map(anime => [{'anime_id': anime.get_id(), 'anime_title': anime.anime.titles.user}, 1]));
    document.add_group('anilist_anime_status', 'Current status of this anime.', animes.map(anime => [{'anime_id': anime.get_id()}, anime.anime.status.toString()]));
    document.add_group('anilist_anime_episode_count', 'Number of episodes published for this anime.', animes.map(anime => [{'anime_id': anime.get_id()}, anime.anime.episodes]));
    document.add_group('anilist_anime_ep_duration_min', 'Average duration of an episode of this anime in minutes.', animes.map(anime => [{'anime_id': anime.get_id()}, anime.anime.duration]));
    document.add_group('anilist_anime_favourite_count', 'Number of users who have this anime as a favourite.', animes.map(anime => [{'anime_id': anime.get_id()}, anime.anime.nb_favourites]));
    document.add_group('anilist_anime_average_score', 'Average score given by the users to this anime (non-weighted !).', animes.map(anime => [{'anime_id': anime.get_id()}, anime.anime.score_mean]));
    document.add_group('anilist_anime_season', 'Season during which this anime was published.', animes.map(anime => [{'anime_id': anime.get_id()}, (anime.anime.season === null) ? 0 : anime.anime.season.season]));
    document.add_group('anilist_anime_year', 'Year during which this anime was published.', animes.map(anime => [{'anime_id': anime.get_id()}, (anime.anime.season === null) ? 0 : anime.anime.season.year]));
    document.add_group('anilist_anime_user_favourite', 'Wether or not the user has this anime as a favourite.', animes.map(anime => [{'user_id': user_id, 'anime_id': anime.get_id()}, anime.favourite ? 1 : 0]));
    document.add_group('anilist_anime_user_rating', 'Score given by the user to this anime (out of 100, 0 if no rating).', animes.map(anime => [{'user_id': user_id, 'anime_id': anime.get_id()}, anime.score]));
    document.add_group('anilist_anime_user_watching_status', 'Watching status of this anime for the user.', animes.map(anime => [{'user_id': user_id, 'anime_id': anime.get_id()}, anime.status]));
    document.add_group('anilist_anime_user_episode_progress', 'Number of episodes of this anime watched by the user.', animes.map(anime => [{'user_id': user_id, 'anime_id': anime.get_id()}, anime.episodes_viewed]));
    document.add_group('anilist_anime_user_rewatches', 'Number of times the user re-watched this anime.', animes.map(anime => [{'user_id': user_id, 'anime_id': anime.get_id()}, anime.repeat]));

    document.add_group('anilist_manga_title', 'Titles associated with manga identifiers.', mangas.map(manga => [{'manga_id': manga.get_id(), 'manga_title': manga.manga.titles.user}, 1]));
    document.add_group('anilist_manga_status', 'Current status of this manga.', mangas.map(manga => [{'manga_id': manga.get_id()}, manga.manga.status.toString()]));
    document.add_group('anilist_manga_volume_count', 'Number of volumes published for this manga.', mangas.map(manga => [{'manga_id': manga.get_id()}, manga.manga.volumes]));
    document.add_group('anilist_manga_chapter_count', 'Number of chapters published for this manga.', mangas.map(manga => [{'manga_id': manga.get_id()}, manga.manga.chapters]));
    document.add_group('anilist_manga_favourite_count', 'Number of users who have this manga as a favourite.', mangas.map(manga => [{'manga_id': manga.get_id()}, manga.manga.nb_favourites]));
    document.add_group('anilist_manga_average_score', 'Average score given by the users to this manga (non-weighted !).', mangas.map(manga => [{'manga_id': manga.get_id()}, manga.manga.score_mean]));
    document.add_group('anilist_manga_user_favourite', 'Wether or not the user has this manga as a favourite.', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.favourite ? 1 : 0]));
    document.add_group('anilist_manga_user_rating', 'Score given by the user to this manga (out of 100, 0 if no rating).', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.score]));
    document.add_group('anilist_manga_user_reading_status', 'Reading status of this manga for the user.', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.status.toString()]));
    document.add_group('anilist_manga_user_volume_progress', 'Number of volumes of this manga read by the user.', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.volumes_read]));
    document.add_group('anilist_manga_user_chapter_progress', 'Number of chapters of this manga read by the user.', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.chapters_read]));
    document.add_group('anilist_manga_user_rereads', 'Number of times the user re-read this manga.', mangas.map(manga => [{'user_id': user_id, 'manga_id': manga.get_id()}, manga.repeat]));

    console.log(`Exporting ${document.nb_groups()} groups, totalling ${document.nb_points()} metric points`);

    res.type('text/plain');
    res.send(document.format());
});
