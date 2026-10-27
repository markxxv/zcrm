import TaskController from './TaskController'
import TaskAttachmentController from './TaskAttachmentController'
import TaskFileController from './TaskFileController'
import TaskLinkController from './TaskLinkController'
import ProjectController from './ProjectController'
import ProjectLinkController from './ProjectLinkController'
import ProjectFileController from './ProjectFileController'
import ProjectTaskFileController from './ProjectTaskFileController'
import ProjectAccessController from './ProjectAccessController'
import Settings from './Settings'

const Controllers = {
    TaskController: Object.assign(TaskController, TaskController),
    TaskAttachmentController: Object.assign(TaskAttachmentController, TaskAttachmentController),
    TaskFileController: Object.assign(TaskFileController, TaskFileController),
    TaskLinkController: Object.assign(TaskLinkController, TaskLinkController),
    ProjectController: Object.assign(ProjectController, ProjectController),
    ProjectLinkController: Object.assign(ProjectLinkController, ProjectLinkController),
    ProjectFileController: Object.assign(ProjectFileController, ProjectFileController),
    ProjectTaskFileController: Object.assign(ProjectTaskFileController, ProjectTaskFileController),
    ProjectAccessController: Object.assign(ProjectAccessController, ProjectAccessController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers