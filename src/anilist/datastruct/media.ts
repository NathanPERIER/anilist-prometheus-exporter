import { FuzzyDate, MediaDTO, MediaEntryDTO, MediaListDTO } from "./dto/media"

export enum MediaType { ANIME, MANGA }

export enum MediaFormat {
    TV,
    TV_SHORT,
    MOVIE,
    SPECIAL,
    OVA,
    ONA,
    MUSIC,
    MANGA,
    NOVEL,
    ONE_SHOT
}

export enum MediaStatus {
    CANCELLED        = 0,
    NOT_YET_RELEASED = 1,
    HIATUS           = 2,
    RELEASING        = 3,
    FINISHED         = 4
}

export enum MediaEntryStatus {
    DROPPED   = 0,
    PAUSED    = 1,
    PLANNING  = 2,
    CURRENT   = 3,
    COMPLETED = 4,
    REPEATING = 5
}

export class Media {

    public constructor(dto: MediaDTO) {
        this.media_id = dto.media_id;
        this.titles = {
            romaji: dto.titles.romaji,
            english: dto.titles.english,
            native: dto.titles.native,
            user: dto.titles.user
        };
        this.format = (<any>MediaFormat)[dto.format];
        this.status = (<any>MediaStatus)[dto.status];
        this.start_date = dto.start_date;
        this.end_date = dto.end_date;
        this.country_of_origin = dto.country_of_origin;
        this.genres = [...dto.genres];
        this.tags = [...dto.tags];
        this.adult = dto.adult;
        this.status_distribution = new Map<MediaEntryStatus, number>(Object.entries(dto.status_distribution).map(
            (value: [string, number]) => [(<any>MediaEntryStatus)[value[0]], value[1]]
        ));
        this.score_distribution = new Map<number, number>(Object.entries(dto.score_distribution).map(
            (value: [string, number]) => [parseInt(value[0]), value[1]]
        ));
        this.score_average = dto.score_average;
        this.score_mean = dto.score_mean;
        this.nb_favourites = dto.nb_favourites;
    }

    public readonly media_id: number;
    public readonly  titles: {
        readonly romaji:  string | null,
        readonly english: string | null,
        readonly native:  string | null,
        readonly user:    string
    };
    public readonly format: MediaFormat;
    public readonly status: MediaStatus;
    public readonly start_date: FuzzyDate;
    public readonly end_date: FuzzyDate;
    public readonly country_of_origin: string;
    public readonly genres: string[];
    public readonly tags: {
        tag_id: number,
        rank: number,
        spoiler: boolean
    }[]
    public readonly adult: boolean;
    public readonly status_distribution: Map<MediaEntryStatus, number>;
    public readonly score_distribution: Map<number, number>;
    public readonly score_average: number;
    public readonly score_mean: number;
    public readonly nb_favourites: number;
}

export class MediaEntry {
    public constructor(dto: MediaEntryDTO) {
        this.status = (<any>MediaEntryStatus)[dto.status];
        this.score = dto.score;
        this.repeat = dto.repeat;
        this.private = dto.private;
        this.custom_lists = new Map<string, boolean>(Object.entries(dto.custom_lists));
        this.favourite = dto.favourite;
    }

    public readonly status: MediaEntryStatus;
    public readonly score: number;
    public readonly repeat: number;
    public readonly private: boolean;
    public readonly custom_lists: Map<string, boolean>;
    public readonly favourite: boolean;
}

export class MediaList {
    public constructor(dto: MediaListDTO) {
        this.name = dto.name;
        this.status = (dto.status === null) ? null : (<any>MediaEntryStatus)[dto.status];
    }

    public readonly name: string;
    public readonly status: MediaEntryStatus | null;
}
