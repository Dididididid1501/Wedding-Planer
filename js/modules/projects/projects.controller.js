// js/modules/projects/projects.controller.js
import { ProjectsModel } from './projects.model.js';
import { ProjectsView } from './projects.view.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { stateManager } from '../../core/storage.js';

export class ProjectsController {
    constructor(state, container, onProjectSelected) {
        this.state = state;
        this.model = new ProjectsModel(state);
        this.view = new ProjectsView(container);
        this.onProjectSelected = onProjectSelected;

        this.view.onCreateProject = (name, weddingDate) => this.createProject(name, weddingDate);
        this.view.onSelectProject = (id) => this.selectProject(id);
        this.view.onDeleteProject = (id) => this.deleteProject(id);
        this.view.onEditProject = (id) => this.openEditModal(id);
        this.view.onUpdateProject = (id, updates) => this.updateProject(id, updates);

        // Подписываемся на обновления, чтобы карточки перерисовывались при изменении данных внутри проектов
        eventBus.on(EVENTS.STATE_CHANGED, () => this.refresh());
        eventBus.on(EVENTS.PROJECT_CREATED, () => this.refresh());
        eventBus.on(EVENTS.PROJECT_DELETED, () => this.refresh());

        this.refresh();
    }

    refresh() {
        const projects = this.model.getAllProjects();
        this.view.render(projects);
    }

    createProject(name, weddingDate) {
        const newProject = stateManager.createProject(name);
        if (weddingDate) {
            stateManager.updateProject(newProject.id, { data: { weddingDate } });
        }
        eventBus.emit(EVENTS.PROJECT_CREATED, newProject);
        this.refresh();
        this.selectProject(newProject.id);
    }

    selectProject(id) {
        stateManager.setActiveProject(id);
        eventBus.emit(EVENTS.PROJECT_SWITCHED, { projectId: id });
        if (this.onProjectSelected) {
            this.onProjectSelected(id);
        }
    }

    deleteProject(id) {
        stateManager.deleteProject(id);
        eventBus.emit(EVENTS.PROJECT_DELETED, { projectId: id });
        this.refresh();
    }

    openEditModal(id) {
        const project = this.model.getProjectById(id);
        if (!project) return;
        this.view.showProjectModal(project);
    }

    updateProject(id, updates) {
        stateManager.updateProject(id, updates);
        eventBus.emit(EVENTS.STATE_CHANGED);
        this.refresh();
    }
}