<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ChunkUpload extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'target_type', 'target_id', 'client_key', 'name',
        'mime_type', 'size', 'chunk_size', 'total_chunks', 'status', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'size' => 'integer',
            'chunk_size' => 'integer',
            'total_chunks' => 'integer',
            'assembled_chunks' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $upload): void {
            $upload->id ??= (string) Str::uuid();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parts(): HasMany
    {
        return $this->hasMany(ChunkUploadPart::class, 'upload_id');
    }

    public function folder(): string
    {
        return 'chunk-uploads/'.$this->id;
    }

    public function partPath(int $index): string
    {
        return $this->folder().'/'.sprintf('%06d', $index).'.part';
    }

    public function assembledPath(): string
    {
        return $this->folder().'/assembled.bin';
    }
}
