# Docker CI/CD VPS Demo

Portfolio DevOps untuk mendemonstrasikan alur deployment aplikasi container ke VPS:

- Aplikasi Node.js tanpa dependency eksternal.
- Dockerfile production dengan health check.
- Docker Compose untuk lokal dan VPS.
- GitHub Actions untuk test, build image, push ke GHCR, lalu deploy via SSH.
- Endpoint `/health` untuk monitoring sederhana.

## Demo Lokal

Jalankan aplikasi langsung:

```bash
npm ci
npm test
npm start
```

Buka:

- `http://localhost:3000`
- `http://localhost:3000/health`

Jalankan dengan Docker Compose:

```bash
docker compose up --build
```

## Struktur

```text
.
+-- .github/workflows/deploy.yml
+-- Dockerfile
+-- docker-compose.yml
+-- docker-compose.prod.yml
+-- nginx/docker-cicd-vps-demo.conf
+-- public/
+-- scripts/deploy.sh
+-- src/server.js
+-- test/server.test.js
```

## Alur CI/CD

Workflow aktif tersedia di `.github/workflows/deploy.yml`. Jika secret VPS belum
diisi, job `Deploy to VPS` tetap menyelesaikan test, build, dan publish image
sebagai mode portfolio build-only. Setelah secret VPS diisi, job yang sama akan
melakukan deployment otomatis via SSH.

1. Developer push ke branch `main`.
2. GitHub Actions menjalankan `npm ci` dan `npm test`.
3. Docker image dibuild dan dipush ke GitHub Container Registry.
4. Workflow login ke VPS via SSH.
5. File Compose dan script deploy dikirim ke VPS.
6. VPS pull image baru, menjalankan `docker compose up -d`, lalu menunggu container sehat.

## Secret GitHub Actions

Tambahkan secret berikut di repository GitHub:

| Secret | Contoh | Keterangan |
| --- | --- | --- |
| `VPS_HOST` | `203.0.113.10` | IP atau domain VPS |
| `VPS_USER` | `deploy` | User SSH di VPS |
| `VPS_SSH_KEY` | private key | Private key untuk login SSH |
| `VPS_PORT` | `22` | Opsional |
| `APP_DIR` | `/opt/docker-cicd-vps-demo` | Opsional |

## Persiapan VPS

Install Docker dan Compose plugin di VPS, lalu siapkan folder aplikasi:

```bash
sudo mkdir -p /opt/docker-cicd-vps-demo
sudo chown -R "$USER:$USER" /opt/docker-cicd-vps-demo
```

Jika GHCR package dibuat private, pastikan token yang dipakai di workflow punya akses package.

## Nginx Reverse Proxy

Contoh config tersedia di `nginx/docker-cicd-vps-demo.conf`. Ganti `server_name example.com`
dengan domain sendiri, lalu aktifkan di server Nginx.

## Endpoint

`GET /health` mengembalikan metadata deployment:

```json
{
  "app": "docker-cicd-vps-demo",
  "status": "ok",
  "version": "local",
  "commit": "unknown",
  "environment": "development",
  "host": "hostname",
  "uptimeSeconds": 1
}
```

## Nilai Portfolio

Project ini menunjukkan kemampuan praktis untuk:

- Membuat aplikasi siap container.
- Menulis pipeline CI/CD end to end.
- Menggunakan image registry.
- Melakukan deployment otomatis ke VPS.
- Menambahkan health check dan reverse proxy.
