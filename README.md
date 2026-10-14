# HAVEN BUILT website — minimal More Projects update

This version preserves the original `index.html` design and content. The only homepage change is the existing **More projects** button now opens `projects.html`, a separate full-projects page populated from `projects-data.json` using details from the supplied company profile.

## Included
- `index.html` — original homepage, with only the More Projects link destination changed.
- `projects.html` and `projects-data.json` — full project listing with search and project-type filtering.
- Original Netlify functions, Supabase schema, logo, and environment example from the source website.

## Authentication
No login or signup UI has been added. No Lovable-generated app is used in this package.

## Email/backend setup
The original Netlify functions and environment-variable setup are retained. Configure the variables in `.env.example` in your hosting provider; never put API keys in frontend HTML. The project page can be previewed locally by serving this folder over HTTP (so `projects-data.json` can be fetched) or by deploying it to Netlify.

## Deploy
Upload/connect this folder to the same hosting provider used by the original site. Verify the homepage still looks as expected and click **More projects** to confirm it opens the full project listing. No public deployment has been performed by this package creation.
