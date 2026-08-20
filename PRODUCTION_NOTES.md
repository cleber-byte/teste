# Solar Consultoria EC — Production Notes

Stable application branch: `solar-production`.

Current source branch used for Vercel preview: `feat/aguia-command-v1`.

Production requirements:
- Use Supabase RLS/authenticated access only.
- Do not restore preview/anonymous policies.
- Use username/password UI; internal synthetic e-mail is hidden from the operator.
- Keep `noindex,nofollow` until the final production URL is approved.
- Preferred Vercel project/domain: `solar-consultoria-ec.vercel.app`.
- Production branch should point to `solar-production` after the dedicated Vercel project is created.
