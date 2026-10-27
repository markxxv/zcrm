<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
