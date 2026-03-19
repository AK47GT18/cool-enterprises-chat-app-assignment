import { EventEmitter } from 'events';

// Global singleton for the message bus
// In Next.js dev mode, we need to attach it to global to survive HMR
declare global {
  var realtimeBus: EventEmitter | undefined;
}

export const realtimeBus = global.realtimeBus || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  global.realtimeBus = realtimeBus;
}

export const REALTIME_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_SEEN: 'message:seen',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  RECORDING_START: 'recording:start',
  RECORDING_STOP: 'recording:stop',
  PRESENCE_UPDATE: 'presence:update',
  USER_UPDATE: 'user:update'
};
