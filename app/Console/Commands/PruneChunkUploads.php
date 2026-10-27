<?php

namespace App\Console\Commands;

use App\Models\ChunkUpload;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneChunkUploads extends Command
{
    protected $signature = 'uploads:prune';
    protected $description = 'Delete expired or completed temporary chunk uploads';

    public function handle(): int
    {
        $removed = 0;

        ChunkUpload::query()
            ->where('expires_at', '<', now())
            ->orderBy('created_at')
            ->chunk(100, function ($uploads) use (&$removed) {
                foreach ($uploads as $upload) {
                    Storage::disk('local')->deleteDirectory($upload->folder());
                    $upload->delete();
                    $removed++;
                }
            });

        $this->info("Pruned {$removed} expired upload sessions.");

        return self::SUCCESS;
    }
}
