import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\TaskFileController::store
* @see app/Http/Controllers/TaskFileController.php:13
* @route '/tasks/{task}/files'
*/
export const store = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/tasks/{task}/files',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TaskFileController::store
* @see app/Http/Controllers/TaskFileController.php:13
* @route '/tasks/{task}/files'
*/
store.url = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskFileController::store
* @see app/Http/Controllers/TaskFileController.php:13
* @route '/tasks/{task}/files'
*/
store.post = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskFileController::store
* @see app/Http/Controllers/TaskFileController.php:13
* @route '/tasks/{task}/files'
*/
const storeForm = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskFileController::store
* @see app/Http/Controllers/TaskFileController.php:13
* @route '/tasks/{task}/files'
*/
storeForm.post = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\TaskFileController::update
* @see app/Http/Controllers/TaskFileController.php:50
* @route '/tasks/{task}/files/{file}'
*/
export const update = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/tasks/{task}/files/{file}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\TaskFileController::update
* @see app/Http/Controllers/TaskFileController.php:50
* @route '/tasks/{task}/files/{file}'
*/
update.url = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            task: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return update.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskFileController::update
* @see app/Http/Controllers/TaskFileController.php:50
* @route '/tasks/{task}/files/{file}'
*/
update.patch = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\TaskFileController::update
* @see app/Http/Controllers/TaskFileController.php:50
* @route '/tasks/{task}/files/{file}'
*/
const updateForm = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskFileController::update
* @see app/Http/Controllers/TaskFileController.php:50
* @route '/tasks/{task}/files/{file}'
*/
updateForm.patch = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
export const download = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/tasks/{task}/files/{file}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
download.url = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            task: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return download.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
download.get = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
download.head = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
const downloadForm = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
downloadForm.get = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TaskFileController::download
* @see app/Http/Controllers/TaskFileController.php:61
* @route '/tasks/{task}/files/{file}/download'
*/
downloadForm.head = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

download.form = downloadForm

/**
* @see \App\Http\Controllers\TaskFileController::destroy
* @see app/Http/Controllers/TaskFileController.php:74
* @route '/tasks/{task}/files/{file}'
*/
export const destroy = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/tasks/{task}/files/{file}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TaskFileController::destroy
* @see app/Http/Controllers/TaskFileController.php:74
* @route '/tasks/{task}/files/{file}'
*/
destroy.url = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            task: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return destroy.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskFileController::destroy
* @see app/Http/Controllers/TaskFileController.php:74
* @route '/tasks/{task}/files/{file}'
*/
destroy.delete = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\TaskFileController::destroy
* @see app/Http/Controllers/TaskFileController.php:74
* @route '/tasks/{task}/files/{file}'
*/
const destroyForm = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskFileController::destroy
* @see app/Http/Controllers/TaskFileController.php:74
* @route '/tasks/{task}/files/{file}'
*/
destroyForm.delete = (args: { task: number | { id: number }, file: number | { id: number } } | [task: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const files = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    download: Object.assign(download, download),
    destroy: Object.assign(destroy, destroy),
}

export default files