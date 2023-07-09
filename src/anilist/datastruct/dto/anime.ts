import { MediaDTO, MediaEntryDTO, MediaListDTO } from './media';

export interface AnimeSeasonDTO {
    season: string,
    year: number
}

export interface AnimeDTO extends MediaDTO {
    type: "ANIME",
    season: AnimeSeasonDTO | null,
    episodes: number,
    duration: number
}

export interface AnimeEntryDTO extends MediaEntryDTO {
    anime_id: number,
    episodes_viewed: number
}

export interface AnimeListDTO extends MediaListDTO {
    animes: AnimeEntryDTO[];
}
