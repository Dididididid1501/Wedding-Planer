import { GuestsController } from './guests.controller.js';

export function initGuestsModule(state, container) {
    return new GuestsController(state, container);
}