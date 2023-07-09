import { MediaDTO, MediaEntryDTO, MediaListDTO } from './media';

export interface MangaDTO extends MediaDTO {
    type: "MANGA",
    chapters: number,
    volumes: number
}

export interface MangaEntryDTO extends MediaEntryDTO {
    manga_id: number,
    volumes_read: number,
    chapters_read: number
}

export interface MangaListDTO extends MediaListDTO {
    mangas: MangaEntryDTO[]
}
