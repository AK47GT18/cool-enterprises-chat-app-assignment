import { EventEmitter } from 'events';
import { REALTIME_EVENTS } from './realtime-constants';

// In Next.js dev mode, we need to attach it to globalThis to survive HMR
declare global {
  var realtimeBus: EventEmitter | undefined;
}

export const realtimeBus = globalThis.realtimeBus || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.realtimeBus = realtimeBus;
}

export { REALTIME_EVENTS };
