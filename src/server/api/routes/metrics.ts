import app from '../../core.js';
import { AnilistConnector } from '../../../anilist/connector.js';
import { DATA_DIRECTORY } from '../../../utils/env.js';
import path from 'path';
import async_fs from 'fs/promises';


function dump_json(filepath: string, data: any): Promise<void> {
    return async_fs.writeFile(filepath, JSON.stringify(data, undefined, '\t'), { encoding: 'utf-8' });
}



app.get('/test', async (_req, res) => {

    const connector = await AnilistConnector.init();

    const user_data = connector.get_user();
    await dump_json(path.join(DATA_DIRECTORY, 'user.json'), user_data);

    const tags_data = await connector.get_tags();
    await dump_json(path.join(DATA_DIRECTORY, 'tags.json'), tags_data);
    
    const anime_data = await connector.get_animes();
    await dump_json(path.join(DATA_DIRECTORY, 'animes.json'     ), Object.fromEntries(anime_data.animes));
    await dump_json(path.join(DATA_DIRECTORY, 'anime_lists.json'), Object.fromEntries(anime_data.anime_lists));
    
    const manga_data = await connector.get_mangas();
    await dump_json(path.join(DATA_DIRECTORY, 'mangas.json'     ), Object.fromEntries(manga_data.mangas));
    await dump_json(path.join(DATA_DIRECTORY, 'manga_lists.json'), Object.fromEntries(manga_data.manga_lists));

    res.type('application/json');
    res.send({ 'animes': Object.fromEntries(anime_data.animes), 'anime_lists': Object.fromEntries(anime_data.anime_lists) });
});
