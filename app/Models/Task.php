<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Task extends Model
{
    protected $fillable = ['title', 'description', 'priority', 'due_date', 'is_completed', 'completed_at'];

    protected $casts = [
        'is_completed' => 'boolean',
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user')->withTimestamps();
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_task')->withTimestamps();
    }

    public function files(): HasMany
    {
        return $this->hasMany(TaskFile::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(TaskLink::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (self $task): void {
            foreach ($task->files as $file) {
                Storage::disk($file->disk)->delete($file->path);
            }
        });
    }

    public function scopeDueToday($query)
    {
        return $query->whereDate('due_date', today());
    }

    public function scopePastDue($query)
    {
        return $query->whereDate('due_date', '<', today())->where('is_completed', false);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('due_date', $date);
    }

    public function scopeIncomplete($query)
    {
        return $query->where('is_completed', false);
    }
}
