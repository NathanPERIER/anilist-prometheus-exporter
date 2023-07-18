import async_fs from 'fs/promises';


export function dump_json(filepath: string, data: any): Promise<void> {
    return async_fs.writeFile(filepath, JSON.stringify(data, undefined, '\t'), { encoding: 'utf-8' });
}

export async function load_json(filepath: string): Promise<any> {
    const raw_data = await async_fs.readFile(filepath, 'utf8');
    return JSON.parse(raw_data);
}
