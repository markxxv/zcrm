<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectAccess extends Model
{
    protected $fillable = ['name', 'category', 'host', 'username', 'secret', 'notes', 'created_by'];

    protected $hidden = ['secret', 'notes'];

    protected function casts(): array
    {
        return ['secret' => 'encrypted', 'notes' => 'encrypted'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
