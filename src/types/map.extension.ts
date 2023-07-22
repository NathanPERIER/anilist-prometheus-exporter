
declare global {
    interface Map<K,V> {
        map<T>(mapper: (value: V, key: K) => T): T[];
    }
}

Map.prototype.map = function<K,V,T>(this: Map<K,V>, mapper: (value: V, key: K) => T): T[] {
    let res: T[] = [];
    this.forEach((value, key) => { res.push(mapper(value, key)); });
    return res;
} 

export {}
