<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Support\FileThumbnail;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskFile extends Model
{
    protected $fillable = ['name', 'path', 'disk', 'mime_type', 'extension', 'size', 'uploaded_by'];

    protected $hidden = ['path', 'disk'];

    protected static function booted(): void
    {
        static::deleted(function (self $file): void {
            FileThumbnail::purge($file);
        });
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
