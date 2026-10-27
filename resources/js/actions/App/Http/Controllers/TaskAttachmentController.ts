import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
export const index = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/tasks/{task}/attachments',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
index.url = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { task: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { task: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            task: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
    }

    return index.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
index.get = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
index.head = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
const indexForm = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
indexForm.get = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskAttachmentController::index
* @see app/Http/Controllers/TaskAttachmentController.php:9
* @route '/tasks/{task}/attachments'
*/
indexForm.head = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

const TaskAttachmentController = { index }

export default TaskAttachmentController