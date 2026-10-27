import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProjectLinkController::store
* @see app/Http/Controllers/ProjectLinkController.php:35
* @route '/projects/{project}/links'
*/
export const store = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/projects/{project}/links',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProjectLinkController::store
* @see app/Http/Controllers/ProjectLinkController.php:35
* @route '/projects/{project}/links'
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
* @see \App\Http\Controllers\ProjectLinkController::store
* @see app/Http/Controllers/ProjectLinkController.php:35
* @route '/projects/{project}/links'
*/
store.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::store
* @see app/Http/Controllers/ProjectLinkController.php:35
* @route '/projects/{project}/links'
*/
const storeForm = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::store
* @see app/Http/Controllers/ProjectLinkController.php:35
* @route '/projects/{project}/links'
*/
storeForm.post = (args: { project: number | { id: number } } | [project: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProjectLinkController::update
* @see app/Http/Controllers/ProjectLinkController.php:45
* @route '/projects/{project}/links/{link}'
*/
export const update = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/projects/{project}/links/{link}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ProjectLinkController::update
* @see app/Http/Controllers/ProjectLinkController.php:45
* @route '/projects/{project}/links/{link}'
*/
update.url = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            link: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        link: typeof args.link === 'object'
        ? args.link.id
        : args.link,
    }

    return update.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{link}', parsedArgs.link.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectLinkController::update
* @see app/Http/Controllers/ProjectLinkController.php:45
* @route '/projects/{project}/links/{link}'
*/
update.patch = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::update
* @see app/Http/Controllers/ProjectLinkController.php:45
* @route '/projects/{project}/links/{link}'
*/
const updateForm = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::update
* @see app/Http/Controllers/ProjectLinkController.php:45
* @route '/projects/{project}/links/{link}'
*/
updateForm.patch = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProjectLinkController::destroy
* @see app/Http/Controllers/ProjectLinkController.php:54
* @route '/projects/{project}/links/{link}'
*/
export const destroy = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/projects/{project}/links/{link}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProjectLinkController::destroy
* @see app/Http/Controllers/ProjectLinkController.php:54
* @route '/projects/{project}/links/{link}'
*/
destroy.url = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            project: args[0],
            link: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        project: typeof args.project === 'object'
        ? args.project.id
        : args.project,
        link: typeof args.link === 'object'
        ? args.link.id
        : args.link,
    }

    return destroy.definition.url
            .replace('{project}', parsedArgs.project.toString())
            .replace('{link}', parsedArgs.link.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProjectLinkController::destroy
* @see app/Http/Controllers/ProjectLinkController.php:54
* @route '/projects/{project}/links/{link}'
*/
destroy.delete = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::destroy
* @see app/Http/Controllers/ProjectLinkController.php:54
* @route '/projects/{project}/links/{link}'
*/
const destroyForm = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProjectLinkController::destroy
* @see app/Http/Controllers/ProjectLinkController.php:54
* @route '/projects/{project}/links/{link}'
*/
destroyForm.delete = (args: { project: number | { id: number }, link: number | { id: number } } | [project: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const links = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default links