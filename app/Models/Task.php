<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_completed' => 'boolean',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_user')
                    ->withTimestamps();
    }

    // Scopes
    public function scopeDueToday($query)
    {
        return $query->whereDate('due_date', today());
    }

    public function scopePastDue($query)
    {
        return $query->where('due_date', '<', today())
                     ->where('is_completed', false);
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