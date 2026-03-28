# MVP Release Checklist

## Pre-Deploy
- Run `npm run lint`
- Run `npm run smoke:mvp`
- Confirm Netlify environment variable `SHOTSTACK_API_KEY` is set
- Confirm Appwrite environment variables are set in Netlify

## Functional Smoke Test
- Login and open Dashboard
- Create text-to-video project
- Generate video and wait for completed status
- Share generated video and open share link
- Upload asset and use it as project background
- Open Billing and verify usage data loads
- Open Settings and change password flow validates correctly

## Reliability/Safety Checks
- If a render is stuck in `processing`, use `Recover Stuck Render`
- Confirm only owner can remove their assets
- Confirm invalid image URL in image-to-video is rejected

## Post-Deploy
- Verify Netlify Function logs for `/api/render/text` and `/api/render/status`
- Run one full end-to-end render in production
