import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProjectFileController::store
* @see app/Http/Controllers/ProjectFileController.php:15
* @route '/projects/{project}/files'
*/
export const store = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/projects/{project}/files',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProjectFileController::store
* @see app/Http/Controllers/ProjectFileController.php:15
* @route '/projects/{project}/files'
*/
store.url = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { project: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { project: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            project: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
    }

    return store.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectFileController::store
* @see app/Http/Controllers/ProjectFileController.php:15
* @route '/projects/{project}/files'
*/
store.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectFileController::store
* @see app/Http/Controllers/ProjectFileController.php:15
* @route '/projects/{project}/files'
*/
const storeForm = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectFileController::store
* @see app/Http/Controllers/ProjectFileController.php:15
* @route '/projects/{project}/files'
*/
storeForm.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProjectFileController::update
* @see app/Http/Controllers/ProjectFileController.php:71
* @route '/projects/{project}/files/{file}'
*/
export const update = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/projects/{project}/files/{file}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ProjectFileController::update
* @see app/Http/Controllers/ProjectFileController.php:71
* @route '/projects/{project}/files/{file}'
*/
update.url = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return update.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectFileController::update
* @see app/Http/Controllers/ProjectFileController.php:71
* @route '/projects/{project}/files/{file}'
*/
update.patch = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProjectFileController::update
* @see app/Http/Controllers/ProjectFileController.php:71
* @route '/projects/{project}/files/{file}'
*/
const updateForm = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectFileController::update
* @see app/Http/Controllers/ProjectFileController.php:71
* @route '/projects/{project}/files/{file}'
*/
updateForm.patch = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
export const download = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/projects/{project}/files/{file}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
download.url = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return download.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
download.get = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
download.head = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
const downloadForm = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
downloadForm.get = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProjectFileController::download
* @see app/Http/Controllers/ProjectFileController.php:90
* @route '/projects/{project}/files/{file}/download'
*/
downloadForm.head = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ProjectFileController::destroy
* @see app/Http/Controllers/ProjectFileController.php:102
* @route '/projects/{project}/files/{file}'
*/
export const destroy = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/projects/{project}/files/{file}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProjectFileController::destroy
* @see app/Http/Controllers/ProjectFileController.php:102
* @route '/projects/{project}/files/{file}'
*/
destroy.url = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            file: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        file: typeof args.file === 'object'
        ? args.file.id
        : args.file,
    }

    return destroy.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectFileController::destroy
* @see app/Http/Controllers/ProjectFileController.php:102
* @route '/projects/{project}/files/{file}'
*/
destroy.delete = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProjectFileController::destroy
* @see app/Http/Controllers/ProjectFileController.php:102
* @route '/projects/{project}/files/{file}'
*/
const destroyForm = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectFileController::destroy
* @see app/Http/Controllers/ProjectFileController.php:102
* @route '/projects/{project}/files/{file}'
*/
destroyForm.delete = (args: { project: number | { id: number }, file: number | { id: number } } | [project: number | { id: number }, file: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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