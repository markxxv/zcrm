import TaskController from './TaskController'
import Settings from './Settings'

const Controllers = {
    TaskController: Object.assign(TaskController, TaskController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers