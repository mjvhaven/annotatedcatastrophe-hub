# annotatedcatastrophe-hub

A personal hub for creative tools and experiments. Built with Astro + Tailwind + Supabase.

## Features

- **Home**: Landing page with links to all features
- **Hex Map Maker** (`/map`): TTRPG map maker with infinite hex grid, tokens, lines, dots, custom colors, and shareable URLs
- **Messages** (`/messages`): Username + password auth, DMs, group chats (Supabase)
- **Blog** (`/blog`): Markdown-powered blog
- **About** (`/about`): About the site

## Tech Stack

- **Frontend**: Astro + Tailwind CSS
- **Database/Auth**: Supabase (for messages)
- **Hosting**: Vercel
- **Version Control**: GitHub

## Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:4321

## Deployment

Push to GitHub → Vercel auto-deploys.

## Supabase Setup (for messages)

1. Create a project at https://supabase.com
2. Run the SQL schema (see `SUPABASE_SCHEMA.sql`)
3. Add credentials to Vercel env vars:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

## License

Personal project.
