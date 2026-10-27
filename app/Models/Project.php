<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Support\FileThumbnail;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = ['name', 'description', 'status', 'created_by'];

    protected static function booted(): void
    {
        static::deleting(function (self $project): void {
            foreach ($project->files as $file) {
                Storage::disk($file->disk)->delete($file->path);
                FileThumbnail::purge($file);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')->withTimestamps();
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'project_task')->withTimestamps();
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(ProjectLink::class);
    }

    public function accesses(): HasMany
    {
        return $this->hasMany(ProjectAccess::class);
    }
}
