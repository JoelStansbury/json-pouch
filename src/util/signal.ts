export type Callback<T> = (arg:T) => void;
export class Signal<T> {
    private _listeners: Set<Callback<T>> = new Set();
    addListener(callback:Callback<T>) {
        this._listeners.add(callback)
    }
    removeListener(callback:Callback<T>) {
        this._listeners.delete(callback)
    }

    emit(value:T) {
        for (const f of this._listeners) {
            f(value);
        }
    }
}