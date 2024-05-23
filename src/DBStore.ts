import { get, isPlainObject, update } from 'lodash-es';
import { upArray } from '@root/src/shared/utils';

class DBStore {
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

    async getValue(key: string | number): Promise<any> {
        return (await this.db.getItem(String(key))) || void 0;
    }

    async getMapValue(key: string | number): Promise<Map<string | number, any>> {
        return (await this.db.getItem(String(key))) ?? new Map();
    }

    async getSetValue(key: string | number): Promise<Set<any>> {
        return (await this.db.getItem(String(key))) ?? new Set();
    }

    async getArrayValue(key: string | number): Promise<any[]> {
        return (await this.db.getItem(String(key))) ?? [];
    }

    async getObjectValue(key: string | number): Promise<Row> {
        return (await this.db.getItem(String(key))) ?? {};
    }

    async setValue(key: string | number, value: any) {
        if (value === DBStore.Break) return;
        await this.db.setItem(String(key), value);
    }

    async byIds(ids: string[], interator?: (item: any, key: string) => any) {
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

    extend(old: Map<string | number, any>, value: Map<string | number, any>);
    extend(old: Map<string | number, any>, value: Record<string | number, any>);
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

    async updateValue(key: string | number, value: Map<string | number, any>);
    async updateValue(key: string | number, value: Set<any>);
    async updateValue(key: string | number, value: any[]);
    async updateValue(key: string | number, value: Record<string | number, any>);
    async updateValue(key: string | number, updater: (item: any) => any);
    async updateValue(...args): Promise<void> {
        const [key, newValue] = args;
        const value = await this.getValue(key);
        const updater = typeof newValue === 'function' ? newValue : (value) => this.extend(value, newValue);
        const result = await updater?.(value);

        // 不写入值
        if (result === DBStore.Break) return;

        // console.log('------>>> tabGroups updateValue', result, value, newValue);
        await this.setValue(key, result);
    }

    async setRows(rows: Rows, key: string | number, updater?: (item: Row) => any) {
        for await (const row of rows) {
            const key$ = get(row, key);
            await this.setValue(key$, (await updater(row)) ?? row);
        }
    }

    async updateRows(rows: Rows = [], key: string | number, updater?: (item: Row) => any) {
        for await (const row of rows) {
            const key$ = get(row, key);
            await this.updateValue(key$, (await updater?.(row)) ?? row);
        }
    }

    async updateMap(map: Map<string | number, any>, updater?: (item: Row) => any) {
        for await (const [key, value] of [...map.entries()]) {
            await this.updateValue(key, (await updater?.(value)) ?? value);
        }
    }

    async updateAll(updater: (item: any) => any) {
        const all = await this.getAllMap();
        for await (const [key, item] of [...all.entries()]) {
            this.setValue(key, await updater(item));
        }
    }

    async remove(keys: string | number | (string | number)[]) {
        const keys$ = upArray(keys);
        for await (const key of keys$) {
            await this.db.removeItem(String(key));
        }
    }

    async clear() {
        await this.db.clear();
    }
}

// 存储group相关信息
export const TabGroupsDB = localforage.createInstance({ name: 'ruyi-tab-groups' });
// 存储tab相关信息
export const TabsDB = localforage.createInstance({ name: 'ruyi-tabs2' });

export const tabGroups$db = new DBStore(TabGroupsDB, true);
export const tabs$db = new DBStore(TabsDB, true);
