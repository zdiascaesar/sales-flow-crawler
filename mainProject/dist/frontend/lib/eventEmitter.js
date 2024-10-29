export class EventEmitter {
    constructor() {
        this.eventListeners = {
            progress: [],
            result: [],
            log: []
        };
    }
    on(event, callback) {
        this.eventListeners[event].push(callback);
    }
    emit(event, ...args) {
        const listeners = this.eventListeners[event];
        listeners.forEach(callback => {
            callback(...args);
        });
    }
}
//# sourceMappingURL=eventEmitter.js.map