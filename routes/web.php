<?php

use App\Http\Controllers\ProjectAccessController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectFileController;
use App\Http\Controllers\ProjectLinkController;
use App\Http\Controllers\ProjectTaskFileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskFileController;
use App\Http\Controllers\TaskLinkController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', fn () => Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
]))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');

    Route::match(['get', 'post', 'patch', 'delete'], '/tasks', [TaskController::class, 'index'])->name('tasks.index');

    Route::get('/tasks/{task}/attachments', [TaskAttachmentController::class, 'index'])->name('tasks.attachments.index');
    Route::post('/tasks/{task}/files', [TaskFileController::class, 'store'])->name('tasks.files.store');
    Route::patch('/tasks/{task}/files/{file}', [TaskFileController::class, 'update'])->name('tasks.files.update');
    Route::get('/tasks/{task}/files/{file}/download', [TaskFileController::class, 'download'])->name('tasks.files.download');
    Route::delete('/tasks/{task}/files/{file}', [TaskFileController::class, 'destroy'])->name('tasks.files.destroy');
    Route::post('/tasks/{task}/links', [TaskLinkController::class, 'store'])->name('tasks.links.store');
    Route::patch('/tasks/{task}/links/{link}', [TaskLinkController::class, 'update'])->name('tasks.links.update');
    Route::delete('/tasks/{task}/links/{link}', [TaskLinkController::class, 'destroy'])->name('tasks.links.destroy');

    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::patch('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::put('/projects/{project}/members', [ProjectController::class, 'members'])->name('projects.members');

    Route::post('/projects/{project}/links', [ProjectLinkController::class, 'store'])->name('projects.links.store');
    Route::patch('/projects/{project}/links/{link}', [ProjectLinkController::class, 'update'])->name('projects.links.update');
    Route::delete('/projects/{project}/links/{link}', [ProjectLinkController::class, 'destroy'])->name('projects.links.destroy');

    Route::post('/projects/{project}/files', [ProjectFileController::class, 'store'])->name('projects.files.store');
    Route::patch('/projects/{project}/files/{file}', [ProjectFileController::class, 'update'])->name('projects.files.update');
    Route::get('/projects/{project}/files/{file}/download', [ProjectFileController::class, 'download'])->name('projects.files.download');
    Route::delete('/projects/{project}/files/{file}', [ProjectFileController::class, 'destroy'])->name('projects.files.destroy');

    Route::get('/projects/{project}/task-files/{file}/download', [ProjectTaskFileController::class, 'download'])->name('projects.task-files.download');
    Route::patch('/projects/{project}/task-files/{file}', [ProjectTaskFileController::class, 'update'])->name('projects.task-files.update');
    Route::delete('/projects/{project}/task-files/{file}', [ProjectTaskFileController::class, 'destroy'])->name('projects.task-files.destroy');

    Route::post('/projects/{project}/access', [ProjectAccessController::class, 'store'])->name('projects.access.store');
    Route::patch('/projects/{project}/access/{access}', [ProjectAccessController::class, 'update'])->name('projects.access.update');
    Route::post('/projects/{project}/access/{access}/reveal', [ProjectAccessController::class, 'reveal'])
        ->middleware('throttle:10,1')->name('projects.access.reveal');
    Route::delete('/projects/{project}/access/{access}', [ProjectAccessController::class, 'destroy'])->name('projects.access.destroy');
});

require __DIR__.'/settings.php';
