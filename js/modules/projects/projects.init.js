// js/modules/projects/projects.init.js
import { ProjectsController } from './projects.controller.js';

export function initProjectsModule(state, container, onProjectSelected) {
    return new ProjectsController(state, container, onProjectSelected);
}