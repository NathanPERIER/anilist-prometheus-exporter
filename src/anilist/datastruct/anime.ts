import { AnimeDTO, AnimeEntryDTO, AnimeListDTO } from './dto/anime';
import { Media, MediaEntry, MediaList, MediaType } from './media';

export enum Season {
    WINTER,
    SPRING,
    SUMMER,
    FALL
}

export interface AnimeSeason {
    season: Season,
    year: number
}

export class Anime extends Media {
    public constructor(dto: AnimeDTO) {
        super(dto);
        this.type = MediaType.ANIME;
        this.season = (dto.season === null) ? null : {
            season: (<any>Season)[dto.season.season],
            year: dto.season.year
        };
        this.episodes = dto.episodes;
        this.duration = dto.duration;
    }

    public readonly type: MediaType.ANIME;
    public readonly season: AnimeSeason | null;
    public readonly episodes: number;
    public readonly duration: number;
}

export class AnimeEntry extends MediaEntry {
    public constructor(dto: AnimeEntryDTO, animes: Map<string, AnimeDTO>) {
        super(dto);
        this.anime = new Anime(animes.get(dto.anime_id.toString())!);
        this.episodes_viewed = dto.episodes_viewed;
    }

    public readonly anime: Anime;
    public readonly episodes_viewed: number;
}

export class AnimeList extends MediaList {
    public constructor(dto: AnimeListDTO, animes: Map<string, AnimeDTO>) {
        super(dto);
        this.animes = dto.animes.map((e: AnimeEntryDTO) => { return new AnimeEntry(e, animes) });
    }

    public readonly animes: AnimeEntry[];
}
