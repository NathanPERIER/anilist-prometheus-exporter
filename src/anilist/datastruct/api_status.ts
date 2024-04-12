
export enum ApiStatus {
    OK = 0,
    UNREACHABLE = 1,
    HTTP_ERROR = 2,
    AUTH_ERROR = 3,
    TIMEOUT = 4
}


export type ApiResult<T> = {ok: true, status: ApiStatus.OK, data: T} | {ok: false, status: ApiStatus};

export function api_ok<T>(data: T): ApiResult<T> {
    return { ok: true, status: ApiStatus.OK, data: data };
}

export function api_err(status: ApiStatus): ApiResult<any> {
    return { ok: false, status: status };
}
