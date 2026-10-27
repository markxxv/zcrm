import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProjectAccessController::store
* @see app/Http/Controllers/ProjectAccessController.php:24
* @route '/projects/{project}/access'
*/
export const store = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/projects/{project}/access',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProjectAccessController::store
* @see app/Http/Controllers/ProjectAccessController.php:24
* @route '/projects/{project}/access'
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
* @see \App\Http\Controllers\ProjectAccessController::store
* @see app/Http/Controllers/ProjectAccessController.php:24
* @route '/projects/{project}/access'
*/
store.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::store
* @see app/Http/Controllers/ProjectAccessController.php:24
* @route '/projects/{project}/access'
*/
const storeForm = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::store
* @see app/Http/Controllers/ProjectAccessController.php:24
* @route '/projects/{project}/access'
*/
storeForm.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProjectAccessController::update
* @see app/Http/Controllers/ProjectAccessController.php:34
* @route '/projects/{project}/access/{access}'
*/
export const update = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/projects/{project}/access/{access}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ProjectAccessController::update
* @see app/Http/Controllers/ProjectAccessController.php:34
* @route '/projects/{project}/access/{access}'
*/
update.url = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            access: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        access: typeof args.access === 'object'
        ? args.access.id
        : args.access,
    }

    return update.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{access}', parsedArgs.access.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectAccessController::update
* @see app/Http/Controllers/ProjectAccessController.php:34
* @route '/projects/{project}/access/{access}'
*/
update.patch = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::update
* @see app/Http/Controllers/ProjectAccessController.php:34
* @route '/projects/{project}/access/{access}'
*/
const updateForm = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::update
* @see app/Http/Controllers/ProjectAccessController.php:34
* @route '/projects/{project}/access/{access}'
*/
updateForm.patch = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProjectAccessController::reveal
* @see app/Http/Controllers/ProjectAccessController.php:47
* @route '/projects/{project}/access/{access}/reveal'
*/
export const reveal = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reveal.url(args, options),
    method: 'post',
})

reveal.definition = {
    methods: ["post"],
    url: '/projects/{project}/access/{access}/reveal',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProjectAccessController::reveal
* @see app/Http/Controllers/ProjectAccessController.php:47
* @route '/projects/{project}/access/{access}/reveal'
*/
reveal.url = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            access: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        access: typeof args.access === 'object'
        ? args.access.id
        : args.access,
    }

    return reveal.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{access}', parsedArgs.access.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectAccessController::reveal
* @see app/Http/Controllers/ProjectAccessController.php:47
* @route '/projects/{project}/access/{access}/reveal'
*/
reveal.post = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reveal.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::reveal
* @see app/Http/Controllers/ProjectAccessController.php:47
* @route '/projects/{project}/access/{access}/reveal'
*/
const revealForm = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reveal.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::reveal
* @see app/Http/Controllers/ProjectAccessController.php:47
* @route '/projects/{project}/access/{access}/reveal'
*/
revealForm.post = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reveal.url(args, options),
    method: 'post',
})

reveal.form = revealForm

/**
* @see \App\Http\Controllers\ProjectAccessController::destroy
* @see app/Http/Controllers/ProjectAccessController.php:64
* @route '/projects/{project}/access/{access}'
*/
export const destroy = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/projects/{project}/access/{access}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProjectAccessController::destroy
* @see app/Http/Controllers/ProjectAccessController.php:64
* @route '/projects/{project}/access/{access}'
*/
destroy.url = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            access: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        access: typeof args.access === 'object'
        ? args.access.id
        : args.access,
    }

    return destroy.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{access}', parsedArgs.access.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectAccessController::destroy
* @see app/Http/Controllers/ProjectAccessController.php:64
* @route '/projects/{project}/access/{access}'
*/
destroy.delete = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::destroy
* @see app/Http/Controllers/ProjectAccessController.php:64
* @route '/projects/{project}/access/{access}'
*/
const destroyForm = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectAccessController::destroy
* @see app/Http/Controllers/ProjectAccessController.php:64
* @route '/projects/{project}/access/{access}'
*/
destroyForm.delete = (args: { project: number | { id: number }, access: number | { id: number } } | [project: number | { id: number }, access: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const access = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    reveal: Object.assign(reveal, reveal),
    destroy: Object.assign(destroy, destroy),
}

export default access