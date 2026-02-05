export type Callback<T> = (arg:T) => void;
export class Signal<T> {
    readonly _listeners: Set<Callback<T>>;
    constructor() {
        this._listeners = new Set<Callback<T>>([]);
    }

    addListener(callback:Callback<T>, remove:boolean=false) {
        if (remove) {
            this._listeners.delete(callback)
        } else {
            this._listeners.add(callback)
        }
    }

    emit(value:T) {
        for (const f of this._listeners) {
            f(value);
        }
    }
}