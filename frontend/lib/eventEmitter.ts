import { EventType, EventCallback, PageInfo } from './types';

export class EventEmitter {
  private eventListeners: {
    [K in EventType]: EventCallback[K][];
  };

  constructor() {
    this.eventListeners = {
      progress: [],
      result: [],
      log: []
    };
  }

  on<T extends EventType>(event: T, callback: EventCallback[T]): void {
    (this.eventListeners[event] as EventCallback[T][]).push(callback);
  }

  emit(event: 'progress', currentPage: number, totalPages: number): void;
  emit(event: 'result', result: PageInfo): void;
  emit(event: 'log', message: string): void;
  emit(event: EventType, ...args: unknown[]): void {
    const listeners = this.eventListeners[event];
    listeners.forEach(callback => {
      (callback as (...args: unknown[]) => void)(...args);
    });
  }
}
