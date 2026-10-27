import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import attachments from './attachments'
import files from './files'
import links from './links'
/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","post","patch","delete","head"],
    url: '/tasks',
} satisfies RouteDefinition<["get","post","patch","delete","head"]>

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: index.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: index.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: index.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
indexForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: index.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
indexForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
indexForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskController::index
* @see app/Http/Controllers/TaskController.php:25
* @route '/tasks'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

const tasks = {
    index: Object.assign(index, index),
    attachments: Object.assign(attachments, attachments),
    files: Object.assign(files, files),
    links: Object.assign(links, links),
}

export default tasks