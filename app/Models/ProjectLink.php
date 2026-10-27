<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLink extends Model
{
    protected $fillable = ['title', 'url', 'kind', 'category', 'notes', 'pinned', 'created_by'];

    protected function casts(): array
    {
        return ['pinned' => 'boolean'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
