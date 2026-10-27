<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chunk_uploads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('target_type', 12);
            $table->unsignedBigInteger('target_id');
            $table->char('client_key', 64);
            $table->string('name');
            $table->string('mime_type', 160)->nullable();
            $table->unsignedBigInteger('size');
            $table->unsignedInteger('chunk_size');
            $table->unsignedInteger('total_chunks');
            $table->unsignedInteger('assembled_chunks')->default(0);
            $table->string('status', 20)->default('uploading');
            $table->unsignedBigInteger('result_id')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->index(['user_id', 'target_type', 'target_id', 'client_key'], 'chunk_upload_resume');
        });

        Schema::create('chunk_upload_parts', function (Blueprint $table) {
            $table->uuid('upload_id');
            $table->unsignedInteger('chunk_index');
            $table->unsignedInteger('size');
            $table->char('sha256', 64);
            $table->primary(['upload_id', 'chunk_index']);
            $table->foreign('upload_id')->references('id')->on('chunk_uploads')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chunk_upload_parts');
        Schema::dropIfExists('chunk_uploads');
    }
};
