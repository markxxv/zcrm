<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AvatarController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => [
                'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120',
                'dimensions:min_width=128,min_height=128,max_width=3200,max_height=3200',
            ],
        ]);

        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'avatar' => 'WebP image processing is not available on the server.',
            ]);
        }

        $upload = $request->file('avatar');
        $binary = file_get_contents($upload->getRealPath());

        if ($binary === false) {
            throw ValidationException::withMessages(['avatar' => 'Unable to read the image.']);
        }

        $dimensions = @getimagesizefromstring($binary);
        if (! $dimensions || $dimensions[0] * $dimensions[1] > 8000000) {
            throw ValidationException::withMessages(['avatar' => 'Image dimensions are too large.']);
        }

        $source = @imagecreatefromstring($binary);
        if ($source === false) {
            throw ValidationException::withMessages(['avatar' => 'Unsupported or invalid image.']);
        }

        try {
            $width = imagesx($source);
            $height = imagesy($source);
            $size = min($width, $height);
            $canvas = imagecreatetruecolor(320, 320);

            if ($canvas === false) {
                throw ValidationException::withMessages(['avatar' => 'Unable to process image.']);
            }

            try {
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                imagefill($canvas, 0, 0, $transparent);

                imagecopyresampled(
                    $canvas,
                    $source,
                    0, 0,
                    (int) floor(($width - $size) / 2),
                    (int) floor(($height - $size) / 2),
                    320, 320, $size, $size
                );

                ob_start();
                $encoded = imagewebp($canvas, null, 82);
                $webp = ob_get_clean();
            } finally {
                imagedestroy($canvas);
            }
        } finally {
            imagedestroy($source);
        }

        if (! $encoded || ! is_string($webp) || $webp === '') {
            throw ValidationException::withMessages(['avatar' => 'Unable to encode the WebP image.']);
        }

        $user = $request->user();
        $previous = $user->avatar_path;
        $path = 'avatars/'.$user->id.'/'.Str::uuid().'.webp';

        if (! Storage::disk('public')->put($path, $webp)) {
            throw ValidationException::withMessages(['avatar' => 'Unable to save the avatar.']);
        }

        try {
            $user->avatar_path = $path;
            $user->save();
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        return to_route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $previous = $user->avatar_path;

        $user->avatar_path = null;
        $user->save();

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        return to_route('profile.edit');
    }
}
