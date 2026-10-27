import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
export const show = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/avatars/{user}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
show.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        user: typeof args.user === 'object'
        ? args.user.id
        : args.user,
    }

    return show.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
show.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
show.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
const showForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
showForm.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::show
* @see app/Http/Controllers/Settings/AvatarController.php:19
* @route '/avatars/{user}'
*/
showForm.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Settings\AvatarController::store
* @see app/Http/Controllers/Settings/AvatarController.php:32
* @route '/settings/profile/avatar'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/profile/avatar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\AvatarController::store
* @see app/Http/Controllers/Settings/AvatarController.php:32
* @route '/settings/profile/avatar'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AvatarController::store
* @see app/Http/Controllers/Settings/AvatarController.php:32
* @route '/settings/profile/avatar'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::store
* @see app/Http/Controllers/Settings/AvatarController.php:32
* @route '/settings/profile/avatar'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::store
* @see app/Http/Controllers/Settings/AvatarController.php:32
* @route '/settings/profile/avatar'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Settings\AvatarController::destroy
* @see app/Http/Controllers/Settings/AvatarController.php:126
* @route '/settings/profile/avatar'
*/
export const destroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/profile/avatar',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\AvatarController::destroy
* @see app/Http/Controllers/Settings/AvatarController.php:126
* @route '/settings/profile/avatar'
*/
destroy.url = (options?: RouteQueryOptions) => {
    return destroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AvatarController::destroy
* @see app/Http/Controllers/Settings/AvatarController.php:126
* @route '/settings/profile/avatar'
*/
destroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::destroy
* @see app/Http/Controllers/Settings/AvatarController.php:126
* @route '/settings/profile/avatar'
*/
const destroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Settings\AvatarController::destroy
* @see app/Http/Controllers/Settings/AvatarController.php:126
* @route '/settings/profile/avatar'
*/
destroyForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const AvatarController = { show, store, destroy }

export default AvatarController