import { TasksController } from './tasks.controller.js';

export function initTasksModule(state, container) {
    return new TasksController(state, container);
}