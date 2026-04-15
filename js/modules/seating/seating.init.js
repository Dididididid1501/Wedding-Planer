import { SeatingController } from './seating.controller.js';

export function initSeatingModule(state, container) {
    return new SeatingController(state, container);
}