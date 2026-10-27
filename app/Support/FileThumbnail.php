<?php

namespace App\Support;

use App\Models\ProjectFile;
use App\Models\TaskFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class FileThumbnail
{
    private const SIZE = 128;
    private const MAX_SOURCE_BYTES = 25165824; // 24 MiB
    private const MAX_PIXELS = 16000000;

    private static function folder(ProjectFile|TaskFile $file): string
    {
        $type = $file instanceof ProjectFile ? 'project' : 'task';

        return 'file-thumbnails/'.$type.'/'.$file->id;
    }

    private static function path(ProjectFile|TaskFile $file): string
    {
        return self::folder($file).'/'.sha1($file->disk.':'.$file->path).'.webp';
    }

    public static function purge(ProjectFile|TaskFile $file): void
    {
        Storage::disk('local')->deleteDirectory(self::folder($file));
    }

    /**
     * Generate 1:1 WebP previews lazily for older files and new chunk uploads.
     * Only private, authenticated routes may call this method.
     */
    public static function response(ProjectFile|TaskFile $file): Response
    {
        $cache = Storage::disk('local');
        $path = self::path($file);

        if (! $cache->exists($path)) {
            self::generate($file, $path);
        }

        abort_unless($cache->exists($path), 404);

        return response($cache->get($path), 200, [
            'Content-Type' => 'image/webp',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private static function generate(ProjectFile|TaskFile $file, string $path): void
    {
        abort_unless(extension_loaded('gd') && function_exists('imagewebp'), 404);
        abort_unless($file->size > 0 && $file->size <= self::MAX_SOURCE_BYTES, 404);

        $storage = Storage::disk($file->disk);
        abort_unless($storage->exists($file->path), 404);
        abort_unless($storage->size($file->path) <= self::MAX_SOURCE_BYTES, 404);

        $content = $storage->get($file->path);
        $info = @getimagesizefromstring($content);

        abort_unless($info && isset($info['mime']) && in_array($info['mime'], [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        ], true), 404);

        [$width, $height] = $info;
        abort_unless(
            $width > 0 && $height > 0 && $width * $height <= self::MAX_PIXELS,
            404
        );

        $source = @imagecreatefromstring($content);
        abort_unless($source !== false, 404);

        try {
            $canvas = imagecreatetruecolor(self::SIZE, self::SIZE);
            abort_unless($canvas !== false, 500);

            try {
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                imagefill($canvas, 0, 0, $transparent);

                $crop = min($width, $height);
                $done = imagecopyresampled(
                    $canvas, $source,
                    0, 0,
                    (int) floor(($width - $crop) / 2),
                    (int) floor(($height - $crop) / 2),
                    self::SIZE, self::SIZE, $crop, $crop
                );
                abort_unless($done, 500);

                ob_start();
                try {
                    $encoded = imagewebp($canvas, null, 80);
                    $webp = ob_get_contents();
                } finally {
                    ob_end_clean();
                }

                abort_unless($encoded && is_string($webp) && $webp !== '', 500);
                abort_unless(Storage::disk('local')->put($path, $webp), 507);
            } finally {
                imagedestroy($canvas);
            }
        } finally {
            imagedestroy($source);
        }
    }
}
