<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = ['name', 'email', 'password'];

    protected $appends = ['avatar'];

    protected $hidden = ['avatar_path', 'password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (self $user): void {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
        });
    }

    public function getAvatarAttribute(): ?string
    {
        return $this->avatar_path
            ? '/avatars/'.$this->getKey().'?v='.substr(sha1($this->avatar_path), 0, 12)
            : null;
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')->withTimestamps();
    }

    public function createdProjects()
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    public function assignedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user')->withTimestamps();
    }
}
