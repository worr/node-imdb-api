// A good case for generics, but javascript has strict
// requirements on what consists of a hashable type.
// It's not even worth it tbh
interface StringHashMap {
    [index: string]: string;
}

export class Inverter {
    private obj: StringHashMap;
    private rev_obj: StringHashMap;

    constructor (obj: Object) {
        this.obj = obj as StringHashMap;
        this.rev_obj = {} as StringHashMap;

        for (let attr in obj) {
            this.rev_obj[obj[attr]] = attr;
        }
    }

    public get(key: string): string {
        if (this.obj[key] !== undefined) {
            return this.obj[key];
        } else if (this.rev_obj[key] !== undefined) {
            return this.rev_obj[key];
        }

        return undefined;
    }
}
