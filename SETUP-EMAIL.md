# Going live: real accounts + email (all free)

| Piece | Free tier | Does |
|---|---|---|
| Supabase | 50k users, 500 MB | Accounts, approval gate, progress |
| Brevo | 300 emails/day, no domain needed | Confirmation emails + notifications |

Emails the site sends:
1. **Confirm your email**, to the person signing up (Supabase, delivered via Brevo SMTP)
2. **New access request**, to every admin, once that person confirms
3. **You're in**, to the person, the moment an admin approves them

## 1. Brevo (about 5 min)
1. Sign up at brevo.com (free plan).
2. **Senders, domains & IPs → Senders → Add sender**: use your Gmail and click the verification link they email you.
3. **SMTP & API → API keys → Generate**. Copy it (starts `xkeysib-`).
4. On the same page, under **SMTP**, note the login and generate an **SMTP key**.

## 2. Supabase (about 10 min)
1. Create a project at supabase.com (free). Pick the London region.
2. **SQL editor**: run these two lines with your values:
   ```sql
   select vault.create_secret('xkeysib-…', 'brevo_api_key');
   select vault.create_secret('you@gmail.com', 'sender_email');
   ```
3. **SQL editor**: paste all of `supabase-schema.sql` and run it.
4. **Authentication → Emails → SMTP settings**: enable custom SMTP.
   Host `smtp-relay.brevo.com`, port `587`, user = Brevo SMTP login,
   password = Brevo SMTP key, sender = your verified Gmail, name `PyML`.
   (Supabase's built-in mailer only sends to your own team, so this step is required.)
5. **Authentication → URL configuration**: Site URL `https://asishteja18.github.io`,
   and add the same address under Redirect URLs.
6. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

## 3. Switch the site to live
Put the URL and anon key into `index.html`, where it says
`const SUPABASE_URL = "";` and `const SUPABASE_ANON_KEY = "";`, then commit.
The anon key is public by design. Never put the service_role key in the site.

## 4. Make yourself admin
Sign up on the site, click the confirmation email, then run this in the SQL editor:
```sql
update profiles set approved = true, is_admin = true where email = 'you@gmail.com';
```
From then on every new request emails you, and approving someone emails them.

## Notes
- Sending from a Gmail address works, but some messages may land in spam.
  Buying a domain and verifying it in Brevo fixes that.
- Share `https://asishteja18.github.io/#signup` as your invite link.
