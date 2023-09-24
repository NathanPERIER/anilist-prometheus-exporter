import { AnimeDTO, AnimeListDTO } from "./anime.js";
import { MangaDTO, MangaListDTO } from "./manga.js";
import { MediaDTO, MediaEntryDTO } from "./media.js";


function zero_default(value: number | null): number {
    return (value === null) ? 0 : value;
}

function read_media_entry(data: {[key: string]: any}): MediaEntryDTO {
    return {
        favourite: data['media']['isFavourite'],
        private: data['private'],
        repeat: data['repeat'],
        score: data['score'],
        status: data['status'],
        custom_lists: (data['customLists'] === null) ? {} : data['customLists']
    }
}


function read_media(data: {[key: string]: any}): MediaDTO {
    let res: MediaDTO = {
        media_id: data['id'],
        titles: {
            english: data['title']['english'],
            romaji: data['title']['romaji'],
            native: data['title']['native'],
            user: data['title']['userPreferred']
        },
        format: data['format'],
        status: data['status'],
        start_date: data['startDate'],
        end_date: data['endDate'],
        country_of_origin: data['countryOfOrigin'],
        genres: data['genres'],
        tags: [],
        adult: data['isAdult'],
        status_distribution: {},
        score_distribution: {},
        score_average: zero_default(data['averageScore']),
        score_mean: zero_default(data['meanScore']),
        nb_favourites: zero_default(data['favourites'])
    }
    for(let tag_data of data['tags']) {
        res.tags.push({
            tag_id: tag_data['id'],
            rank: tag_data['rank'],
            spoiler: tag_data['isMediaSpoiler']
        })
    }
    if(data['stats']['statusDistribution'] !== null) {
        for(let distrib of data['stats']['statusDistribution']) {
            res.status_distribution[distrib['status']] = distrib['amount']
        }
    }
    if(data['stats']['scoreDistribution'] !== null) {
        for(let distrib of data['stats']['scoreDistribution']) {
            const score = (distrib['score'] as number).toString()
            res.score_distribution[score] = distrib['amount']
        }
    }
    return res;
}


export function read_anime_lists(lists: Map<string, AnimeListDTO>, animes: Map<string, AnimeDTO>, data: {[key: string]: any}[]): void {
    for(let list_data of data) {
        if(list_data['isCustomList']) {
            continue;
        }
        const list_name: string = list_data['name'];
        if(!lists.has(list_name)) {
            lists.set(list_name, {
                name: list_name,
                status: list_data['status'],
                animes: []
            });
        }
        let list = lists.get(list_name)!;
        for(let entry_data of list_data['entries']) {
            let anime_id: number = entry_data['media']['id'];
            list.animes.push({
                anime_id: anime_id,
                episodes_viewed: entry_data['progress'],
                ...read_media_entry(entry_data)
            });
            if(!animes.has(anime_id.toString())) {
                animes.set(anime_id.toString(), {
                    type: "ANIME",
                    season: (entry_data['media']['season'] == null || entry_data['media']['seasonYear'] == null) ? null : {
                        season: entry_data['media']['season'],
                        year: entry_data['media']['seasonYear']
                    },
                    episodes: zero_default(entry_data['media']['episodes']),
                    duration: zero_default(entry_data['media']['duration']),
                    ...read_media(entry_data['media'])
                });
            }
        }
    }    
}

export function read_manga_lists(lists: Map<string, MangaListDTO>, mangas: Map<string, MangaDTO>, data: {[key: string]: any}[]): void {
    for(let list_data of data) {
        if(list_data['isCustomList']) {
            continue;
        }
        const list_name: string = list_data['name'];
        if(!lists.has(list_name)) {
            lists.set(list_name, {
                name: list_name,
                status: list_data['status'],
                mangas: []
            });
        }
        let list = lists.get(list_name)!;
        for(let entry_data of list_data['entries']) {
            let manga_id: number = entry_data['media']['id'];
            list.mangas.push({
                manga_id: manga_id,
                chapters_read: entry_data['progress'],
                volumes_read: entry_data['progressVolumes'],
                ...read_media_entry(entry_data)
            });
            if(!mangas.has(manga_id.toString())) {
                mangas.set(manga_id.toString(), {
                    type: "MANGA",
                    chapters: zero_default(entry_data['media']['chapters']),
                    volumes: zero_default(entry_data['media']['volumes']),
                    ...read_media(entry_data['media'])
                });
            }
        }
    }    
}
