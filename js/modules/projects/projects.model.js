// js/modules/projects/projects.model.js
export class ProjectsModel {
    constructor(state) {
        this.state = state;
    }

    getAllProjects() {
        return this.state.projects || [];
    }

    getProjectById(id) {
        return this.state.projects.find(p => p.id === id);
    }

    getActiveProject() {
        return this.state.projects.find(p => p.id === this.state.activeProjectId) || null;
    }

    createProject(name) {
        // Логика создания будет в storage, здесь просто заглушка для контроллера
        return name;
    }

    deleteProject(id) {
        // Аналогично
        return id;
    }
}