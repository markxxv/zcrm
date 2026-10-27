<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Support\FileThumbnail;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFile extends Model
{
    protected $fillable = ['name', 'path', 'disk', 'mime_type', 'extension', 'size', 'tags', 'uploaded_by'];

    protected $hidden = ['path', 'disk'];

    protected function casts(): array
    {
        return ['tags' => 'array'];
    }

    protected static function booted(): void
    {
        static::deleted(function (self $file): void {
            FileThumbnail::purge($file);
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
