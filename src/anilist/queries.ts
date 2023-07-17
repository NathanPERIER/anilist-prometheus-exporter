
export const tags_query = '\
query {\
    MediaTagCollection {\
        id\
        name\
        description\
        category\
        isAdult\
    }\
}';

export const authenticated_user_query = '\
query {\
    Viewer {\
        id\
        name\
        unreadNotificationCount\
    }\
}';
// options {\
//     titleLanguage\
//     profileColor\
// }\
// mediaListOptions {\
//     scoreFormat\
// }\

export const anime_query = '\
query ($user_id: Int, $chunk: Int) {\
    MediaListCollection(userId: $user_id, type: ANIME, chunk: $chunk, perChunk: 100) {\
        lists{\
            entries {\
                id\
                status\
                score\
                progress\
                repeat\
                private\
                customLists\
                media {\
                    id\
                    title {\
                        romaji\
                        english\
                        native\
                        userPreferred\
                    }\
                    type\
                    format\
                    status\
                    startDate {\
                        year\
                        month\
                        day\
                    }\
                    endDate {\
                        year\
                        month\
                        day\
                    }\
                    season\
                    seasonYear\
                    episodes\
                    duration\
                    countryOfOrigin\
                    genres\
                    averageScore\
                    meanScore\
                    tags {\
                        id\
                        name\
                        category\
                        rank\
                        isMediaSpoiler\
                        isAdult\
                    }\
                    favourites\
                    isFavourite\
                    isAdult\
                    stats {\
                        scoreDistribution {\
                            score\
                            amount\
                        }\
                        statusDistribution{\
                            status\
                            amount\
                        }\
                    }\
                }\
            }\
            name\
            isCustomList\
            status\
        }\
        hasNextChunk\
    }\
}';

export const manga_query = '\
query ($user_id: Int, $chunk: Int) {\
    MediaListCollection(userId: $user_id, type: MANGA, chunk: $chunk, perChunk: 100) {\
        lists{\
            entries {\
                id\
                status\
                score\
                progress\
                progressVolumes\
                repeat\
                private\
                customLists\
                media {\
                    id\
                    title {\
                        romaji\
                        english\
                        native\
                        userPreferred\
                    }\
                    type\
                    format\
                    status\
                    startDate {\
                        year\
                        month\
                        day\
                    }\
                    endDate {\
                        year\
                        month\
                        day\
                    }\
                    chapters\
                    volumes\
                    countryOfOrigin\
                    genres\
                    averageScore\
                    meanScore\
                    tags {\
                        id\
                        name\
                        category\
                        rank\
                        isMediaSpoiler\
                        isAdult\
                    }\
                    favourites\
                    isFavourite\
                    isAdult\
                    stats {\
                        scoreDistribution {\
                            score\
                            amount\
                        }\
                        statusDistribution{\
                            status\
                            amount\
                        }\
                    }\
                }\
            }\
            name\
            isCustomList\
            status\
        }\
        hasNextChunk\
    }\
}';
