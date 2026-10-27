<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChunkUploadPart extends Model
{
    public $timestamps = false;
    public $incrementing = false;
    protected $table = 'chunk_upload_parts';
    protected $fillable = ['chunk_index', 'size', 'sha256'];
}
