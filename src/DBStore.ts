import { get, isNil, isPlainObject } from 'lodash-es';
import { upArray } from '@root/src/shared/utils';
import { DBKey } from './DBs';

export class DBStore {
    static Break = Symbol('break');
    db: LocalForage;
    isToggleNumberStringKey: boolean;

    constructor(DB, isToggleNumberStringKey) {
        this.db = DB;
        this.isToggleNumberStringKey = isToggleNumberStringKey;
    }

    stringToNumber(key: string) {
        return this.isToggleNumberStringKey ? +key : key;
    }

    stn = this.stringToNumber;

    numberToString(key: number) {
        return this.isToggleNumberStringKey ? key.toString() : key;
    }

    nts = this.numberToString;

    async getValue(key: DBKey): Promise<any> {
        return (await this.db.getItem(String(key))) || void 0;
    }

    async getMapValue(key: DBKey): Promise<Map<DBKey, any>> {
        return (await this.db.getItem(String(key))) ?? new Map();
    }

    async getSetValue(key: DBKey): Promise<Set<any>> {
        return (await this.db.getItem(String(key))) ?? new Set();
    }

    async getArrayValue(key: DBKey): Promise<any[]> {
        return (await this.db.getItem(String(key))) ?? [];
    }

    async getObjectValue(key: DBKey): Promise<Row> {
        return (await this.db.getItem(String(key))) ?? {};
    }

    async setValue(key: DBKey, value: any) {
        if (value === DBStore.Break) return;
        await this.db.setItem(String(key), value);
    }

    async byIds(ids: string[], interator?: (item: any, key: DBKey) => any) {
        const result = [];
        for await (const id of ids) {
            const item = await this.getValue(id);
            const value = (await interator?.(item, id)) ?? item;
            result.push(value);
        }
        return result;
    }

    async getAllMap() {
        const map = new Map();
        await this.db.iterate((value, key) => {
            map.set(this.stn(key), value);
        });
        return map;
    }

    async getAll() {
        const all = [];
        await this.db.iterate((value, key) => {
            all.push(value);
        });
        return all;
    }

    extend(old: Map<DBKey, any>, value: Map<DBKey, any>);
    extend(old: Map<DBKey, any>, value: Record<DBKey, any>);
    extend(old: Set<any>, value: Set<any>);
    extend(old: Set<any>, value: any[]);
    extend(old: Row, value: Row);
    extend(...args) {
        const [old, value] = args;

        if (old instanceof Map) {
            const entities = value instanceof Map ? [...value.entries()] : Object.entries(value);
            for (const [key, val] of entities) {
                old.set(key, val);
            }
            return old;
        } else if (old instanceof Set) {
            for (const val of value) {
                old.delete(value);
                old.add(value);
            }
            return old;
        } else if (isPlainObject(old)) {
            return { ...old, ...value };
        } else {
            return value;
        }
    }

    /**
     * 值初始化
     * 若原值存在，则保持不动，
     * 若不存在，则写入该值
     */
    async initValue(key: DBKey, value: any) {
        const value$ = await this.getValue(key);
        if (isNil(value$)) {
            await this.setValue(key, value);
        }
    }

    /**
     * 值更新
     * value 值根据不同的值类型 覆盖或继承值
     */
    async updateValue(key: DBKey, value: string | number | boolean);
    async updateValue(key: DBKey, value: Map<DBKey, any>);
    async updateValue(key: DBKey, value: Set<any>);
    async updateValue(key: DBKey, value: any[]);
    async updateValue(key: DBKey, value: Record<DBKey, any>);
    async updateValue(key: DBKey, updater: (item: any, key: DBKey) => any);
    async updateValue(...args): Promise<void> {
        const [key, func] = args;
        const value = await this.getValue(key);
        const updater = typeof func === 'function' ? func : (value) => func;
        const newValue = await updater?.(value, key);

        // 不写入值
        if (newValue === DBStore.Break) return;

        const result = this.extend(value, newValue);

        // console.log('------>>> tabGroups updateValue', result, value, newValue);
        await this.setValue(key, result);
    }

    async setRows(rows: Rows, key: DBKey, updater?: (item: Row, key: DBKey) => any) {
        for await (const row of rows) {
            const key$ = get(row, key);
            await this.setValue(key$, (await updater(row, key$)) ?? row);
        }
    }

    async updateRows(rows: Rows = [], key: DBKey, updater?: (item: Row, key: DBKey) => any) {
        for await (const row of rows) {
            const key$ = get(row, key);
            await this.updateValue(key$, (await updater?.(row, key$)) ?? row);
        }
    }

    async updateMap(map: Map<DBKey, any>, updater?: (item: Row, key: DBKey) => any) {
        for await (const [key, value] of [...map.entries()]) {
            await this.updateValue(key, (await updater?.(value, key)) ?? value);
        }
    }

    async updateAll(updater: (item: any, key: DBKey) => any) {
        const all = await this.getAllMap();
        for await (const [key, item] of [...all.entries()]) {
            this.setValue(key, await updater(item, key));
        }
    }

    async remove(keys: DBKey | DBKey[]) {
        const keys$ = upArray(keys);
        for await (const key of keys$) {
            await this.db.removeItem(String(key));
        }
    }

    async removeRows(rows: Rows, key: DBKey) {
        if (!rows?.length) return;
        const keys = rows.map((row) => get(row, key));
        await this.remove(keys);
    }

    async clear() {
        await this.db.clear();
    }
}
