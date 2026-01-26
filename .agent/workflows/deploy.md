---
description: How to deploy Vault Web to Vercel
---

Follow these steps to deploy your application so you can access it anywhere:

1. **Push your code to GitHub**:
   - Create a new repository on [GitHub](https://github.com/new).
   - In your terminal, run:
     ```bash
     git remote add origin YOUR_GITHUB_REPO_URL
     git add .
     git commit -m "Prepare for deployment"
     git push -u origin main
     ```

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com) and sign in with your GitHub account.
   - Click "Add New" -> "Project".
   - Import your `Vault Web` repository.

3. **Configure and Deploy**:
   - Vercel will automatically detect that you're using Next.js.
   - Leave all settings as default.
   - Click **"Deploy"**.

4. **Access on your phone**:
   - Once the deployment is finished, Vercel will give you a URL (e.g., `vault-web.vercel.app`).
   - Open this URL on your phone's browser.
   - For a "real app" feel, tap the **Share** button on iOS (or **Menu** on Android) and select **"Add to Home Screen"**.

// turbo
5. **Verify the build**:
   Run `npm run build` locally first to ensure there are no production errors.
