import { MangaDTO, MangaEntryDTO, MangaListDTO } from './dto/manga';
import { Media, MediaEntry, MediaList, MediaType } from './media';

export class Manga extends Media {
    public constructor(dto: MangaDTO) {
        super(dto);
        this.type = MediaType.MANGA;
        this.chapters = dto.chapters;
        this.volumes = dto.volumes;
    }

    public readonly type: MediaType.MANGA;
    public readonly chapters: number;
    public readonly volumes: number;
}

export class MangaEntry extends MediaEntry {
    public constructor(dto: MangaEntryDTO, mangas: Map<string, MangaDTO>) {
        super(dto);
        this.manga = new Manga(mangas.get(dto.manga_id.toString())!);
        this.volumes_read = dto.volumes_read;
        this.chapters_read = dto.chapters_read;
    }

    public readonly manga: Manga;
    public readonly volumes_read: number;
    public readonly chapters_read: number;
}

export class MangaList extends MediaList {
    public constructor(dto: MangaListDTO, mangas: Map<string, MangaDTO>) {
        super(dto);
        this.mangas = dto.mangas.map((e: MangaEntryDTO) => { return new MangaEntry(e, mangas)});
    }

    public readonly mangas: MangaEntry[];
}
