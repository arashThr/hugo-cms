# Hugo-Flow: Git-based Front-end interface for Hugo

A custom, web-based Front-end interface for your static Hugo website.

## Features
- **GitHub Integration:** Commit files directly to your repository via the GitHub API.
- **Dynamic Configuration:** Select your repository and paths dynamically via the UI.
- **Dual Editor Mode:** Switch seamlessly between a WYSIWYG Rich Text editor and a raw Markdown editor.
- **Image Uploads:** Upload images and have them automatically pushed as base64 blobs alongside your markdown post.

## Local Development

1. Set up your `.env.local` file:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

2. Run the development server:
```bash
npm install
npm run dev
```

## Production Deployment (Standard Node.js)

If you are not using Docker, you can run the application directly using Node.js:

1. Ensure your `.env.local` is configured with your production keys and URL.
2. Build the optimized production bundle:
```bash
npm run build
```
3. Start the production server:
```bash
npm start
```
The application will be running on `http://localhost:3000`.

## Production Deployment (Docker + Caddy)

This application is ready to be deployed using Docker and Docker Compose. It leverages Next.js standalone output for a highly optimized, minimal container size.

### 1. Update GitHub OAuth App
Update your GitHub OAuth App's "Authorization callback URL" to your production domain:
`https://your-domain.com/api/auth/callback/github`

### 2. Set Production Environment Variables
Create a `.env` file on your server in the same directory as `docker-compose.yml`:
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secure_random_string (generate via: openssl rand -base64 32)
GITHUB_ID=your_production_github_id
GITHUB_SECRET=your_production_github_secret
```

### 3. Run with Docker Compose
Start the application in the background:
```bash
docker-compose up -d --build
```
This will expose the app on port `3000` of your host machine.

### 4. Setup Caddy Reverse Proxy
If you are using Caddy to serve your domain, simply add this block to your `Caddyfile`:

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

Reload Caddy (`caddy reload`), and your application will be securely available over HTTPS!

+++