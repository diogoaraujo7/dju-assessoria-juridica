
type Listener<T> = (event: T) => void;

export class EventEmitter<T> {
    private listeners = new Set<Listener<T>>();

    subscribe(listener: Listener<T>) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    protected emit(event: T) {
        this.listeners.forEach((listener) => listener(event));
    }
}
