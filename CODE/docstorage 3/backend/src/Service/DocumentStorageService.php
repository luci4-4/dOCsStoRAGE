<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;

class DocumentStorageService
{
    private string $uploadDir;

    public function __construct(string $projectDir)
    {
        $this->uploadDir = $projectDir . '/var/uploads';
    }

    public function store(UploadedFile $file, int $userId): string
    {
        $dir = $this->uploadDir . '/' . $userId;
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new \RuntimeException('Cannot create upload directory');
        }

        $ext = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);
        $filename = bin2hex(random_bytes(16)) . ($ext ? '.' . $ext : '');
        $file->move($dir, $filename);

        return $userId . '/' . $filename;
    }

    public function absolutePath(string $storedPath): string
    {
        return $this->uploadDir . '/' . $storedPath;
    }

    public function read(string $storedPath): string
    {
        $path = $this->absolutePath($storedPath);
        if (!is_readable($path)) {
            throw new \RuntimeException('File not found');
        }

        return file_get_contents($path);
    }

    public function delete(string $storedPath): void
    {
        $path = $this->absolutePath($storedPath);
        if (is_file($path)) {
            unlink($path);
        }
    }
}
