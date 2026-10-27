<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('path');
            $table->string('disk', 30)->default('local');
            $table->string('mime_type', 160)->nullable();
            $table->string('extension', 20)->nullable();
            $table->unsignedBigInteger('size');
            $table->timestamps();
            $table->index(['task_id', 'created_at']);
        });

        Schema::create('task_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('url');
            $table->string('kind', 20)->default('web');
            $table->timestamps();
            $table->index(['task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_links');
        Schema::dropIfExists('task_files');
    }
};
