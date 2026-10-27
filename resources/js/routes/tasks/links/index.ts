import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\TaskLinkController::store
* @see app/Http/Controllers/TaskLinkController.php:33
* @route '/tasks/{task}/links'
*/
export const store = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/tasks/{task}/links',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TaskLinkController::store
* @see app/Http/Controllers/TaskLinkController.php:33
* @route '/tasks/{task}/links'
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
* @see \App\Http\Controllers\TaskLinkController::store
* @see app/Http/Controllers/TaskLinkController.php:33
* @route '/tasks/{task}/links'
*/
store.post = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskLinkController::store
* @see app/Http/Controllers/TaskLinkController.php:33
* @route '/tasks/{task}/links'
*/
const storeForm = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskLinkController::store
* @see app/Http/Controllers/TaskLinkController.php:33
* @route '/tasks/{task}/links'
*/
storeForm.post = (args: { task: number | { id: number } } | [task: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\TaskLinkController::update
* @see app/Http/Controllers/TaskLinkController.php:44
* @route '/tasks/{task}/links/{link}'
*/
export const update = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/tasks/{task}/links/{link}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\TaskLinkController::update
* @see app/Http/Controllers/TaskLinkController.php:44
* @route '/tasks/{task}/links/{link}'
*/
update.url = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            task: args[0],
            link: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
        link: typeof args.link === 'object'
        ? args.link.id
        : args.link,
    }

    return update.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace('{link}', parsedArgs.link.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskLinkController::update
* @see app/Http/Controllers/TaskLinkController.php:44
* @route '/tasks/{task}/links/{link}'
*/
update.patch = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\TaskLinkController::update
* @see app/Http/Controllers/TaskLinkController.php:44
* @route '/tasks/{task}/links/{link}'
*/
const updateForm = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskLinkController::update
* @see app/Http/Controllers/TaskLinkController.php:44
* @route '/tasks/{task}/links/{link}'
*/
updateForm.patch = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\TaskLinkController::destroy
* @see app/Http/Controllers/TaskLinkController.php:54
* @route '/tasks/{task}/links/{link}'
*/
export const destroy = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/tasks/{task}/links/{link}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TaskLinkController::destroy
* @see app/Http/Controllers/TaskLinkController.php:54
* @route '/tasks/{task}/links/{link}'
*/
destroy.url = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            task: args[0],
            link: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        task: typeof args.task === 'object'
        ? args.task.id
        : args.task,
        link: typeof args.link === 'object'
        ? args.link.id
        : args.link,
    }

    return destroy.definition.url
            .replace('{task}', parsedArgs.task.toString())
            .replace('{link}', parsedArgs.link.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TaskLinkController::destroy
* @see app/Http/Controllers/TaskLinkController.php:54
* @route '/tasks/{task}/links/{link}'
*/
destroy.delete = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\TaskLinkController::destroy
* @see app/Http/Controllers/TaskLinkController.php:54
* @route '/tasks/{task}/links/{link}'
*/
const destroyForm = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TaskLinkController::destroy
* @see app/Http/Controllers/TaskLinkController.php:54
* @route '/tasks/{task}/links/{link}'
*/
destroyForm.delete = (args: { task: number | { id: number }, link: number | { id: number } } | [task: number | { id: number }, link: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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