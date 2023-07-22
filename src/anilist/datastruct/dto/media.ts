

export interface FuzzyDate {
    year:  number | null,
    month: number | null,
    day:   number | null,
}


export interface MediaEntryDTO {
    status: string;
    score: number;
    repeat: number;
    private: boolean;
    custom_lists: { [key: string]: boolean };
    favourite: boolean;
}

export interface MediaListDTO {
    name: string;
    status: string | null;
}

export interface MediaDTO {
    media_id: number;
    titles: {
        romaji:  string | null,
        english: string | null,
        native:  string | null,
        user:    string
    };
    format: string;
    status: string;
    start_date: FuzzyDate;
    end_date: FuzzyDate;
    country_of_origin: string;
    genres: string[];
    tags: {
        tag_id: number,
        rank: number,
        spoiler: boolean
    }[];
    adult: boolean;
    status_distribution: { [status: string]: number };
    score_distribution: { [score: string]: number };
    score_average: number;
    score_mean: number;
    nb_favourites: number;
}
