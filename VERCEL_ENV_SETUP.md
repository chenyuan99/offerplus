# Vercel Environment Variables Configuration

To complete the deployment, set the following environment variables in Vercel Dashboard:

## New Environment Variables

| Variable Name | Value |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://lwexhbimtxpndhsidogl.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXhoYmltdHhwbmRoc2lkb2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjIzMTEsImV4cCI6MjA5MzQ5ODMxMX0.Bc-Kw8qdmUrSGijhnhIJfdJUS86uK2SW2lOBrRjn3DU |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | sb_publishable_26L3XvWKdAd7VrZceHcrTg_RIcOGJbp |
| NEXT_PUBLIC_LOGO_DEV_TOKEN | pk_aWso2iQjSW25SO13OEAtNA |
| NEXT_PUBLIC_SITE_URL | https://offersplus.io |

## Steps to Configure

1. Go to Vercel Dashboard: https://vercel.com/riseworks/offerplus
2. Navigate to Settings → Environment Variables
3. For each variable above:
   - Click "Add New"
   - Enter the key name
   - Enter the value
   - Select target: "Production", "Preview", and "Development"
   - Click "Save"
4. After all variables are added, trigger a new deployment
5. Verify the application loads correctly with the new environment variables

## Alternative: Using Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_LOGO_DEV_TOKEN
vercel env add NEXT_PUBLIC_SITE_URL
```

Then redeploy:
```bash
vercel deploy --prod
```
