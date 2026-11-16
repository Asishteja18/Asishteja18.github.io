# Going live: real accounts + email (all free)

| Piece | Free tier | Does |
|---|---|---|
| Supabase | 50k users, 500 MB | Accounts, progress |
| Brevo | 300 emails/day, no domain needed | Sign-up code emails |

The only email is the **6-digit sign-up code** (Supabase, delivered via Brevo
SMTP). The account only works once the code is typed in.

## 1. Brevo (about 5 min)
1. Sign up at brevo.com (free plan).
2. **Senders, domains & IPs → Senders → Add sender**: use your Gmail and click the verification link they email you.
3. On the same page, under **SMTP**, note the login and generate an **SMTP key**.

## 2. Supabase (about 10 min)
1. Create a project at supabase.com (free). Pick the London region.
2. **SQL editor**: paste all of `supabase-schema.sql` and run it.
3. **Authentication → Emails → SMTP settings**: enable custom SMTP.
   Host `smtp-relay.brevo.com`, port `587`, user = Brevo SMTP login,
   password = Brevo SMTP key, sender = your verified Gmail, name `PyML`.
   (Supabase's built-in mailer only sends to your own team, so this step is required.)
4. **Authentication → Emails → Templates → Confirm signup**: replace the body with
   ```html
   <h2>Your PyML code</h2>
   <p>Enter this code to finish signing up:</p>
   <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>It expires in an hour. If you didn't sign up, ignore this email.</p>
   ```
   Subject: `Your PyML code`. Check **Authentication → Providers → Email** has
   "Confirm email" on and the email OTP length set to 6.
5. **Authentication → URL configuration**: Site URL `https://asishteja18.github.io`,
   and add the same address under Redirect URLs.
6. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

## 3. Switch the site to live
Put the URL and anon key into `index.html`, where it says
`const SUPABASE_URL = "";` and `const SUPABASE_ANON_KEY = "";`, then commit.
The anon key is public by design. Never put the service_role key in the site.

## 4. Make yourself admin
Sign up on the site, enter the code from the email, then run this in the SQL editor:
```sql
update profiles set is_admin = true where email = 'you@gmail.com';
```
The admin page (`#admin`) lets you block or restore any account.

## Notes
- Sending from a Gmail address works, but some messages may land in spam.
  Buying a domain and verifying it in Brevo fixes that.
- Share `https://asishteja18.github.io/#signup` as your sign-up link.
