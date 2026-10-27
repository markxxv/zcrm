<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskLink extends Model
{
    protected $fillable = ['title', 'url', 'kind', 'created_by'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
