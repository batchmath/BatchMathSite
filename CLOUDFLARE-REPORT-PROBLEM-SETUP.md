# BatchMath Report a Problem — Cloudflare Worker + Resend setup

The website is already configured to submit reports to the same-origin endpoint:

`https://batchmath.net/api/report-problem`

The Worker source is in `cloudflare/report-problem-worker/`. It sends mail by calling Resend's HTTPS API. It does not use a Cloudflare email-sending binding. The Resend API key and both email addresses are configured only as Worker secrets.

## 1. Create the free Resend account

1. Open [https://resend.com](https://resend.com) and select **Get Started**.
2. Create the account and sign in to the Resend dashboard.

## 2. Add and verify `batchmath.net` in Resend

1. In Resend, open **Domains** from the left sidebar.
2. Select **Add Domain**.
3. Enter `batchmath.net`, keep sending enabled, select the recommended sending region, and create the domain.
4. Resend will display the DNS records generated for this domain. Leave this page open; the record values are unique to the Resend domain setup and must be copied exactly.
5. In another tab, sign in to Cloudflare, open **Websites**, select **batchmath.net**, and open **DNS → Records**.
6. Add every sending-verification record shown by Resend. The current Resend setup normally shows:
   - a **DKIM** record (TXT, or CNAME if Resend specifically displays CNAME);
   - an **SPF** TXT record on Resend's return-path subdomain, normally `send`;
   - an **MX** record on that same return-path subdomain, using the exact mail-server target and priority Resend displays;
   - a **DMARC** TXT record at `_dmarc` when Resend displays one.
7. For each record, copy Resend's **Type**, **Name**, **Value/Content**, and **Priority** exactly into Cloudflare. Leave **TTL** on **Auto**. If Cloudflare offers a proxy switch for a CNAME, select **DNS only** (gray cloud).
8. Do not create a second `_dmarc` TXT record if one already exists. Keep the existing `_dmarc` record and use Resend's verification screen to confirm that it satisfies the domain check.
9. Return to the Resend domain page and select **Verify DNS Records**. Wait until the sending capability for `batchmath.net` is marked **Verified**.

Resend's current Cloudflare instructions are at [https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/).

No mailbox has to be created for `reports@batchmath.net`. Verification authorizes Resend to use that address as the sender.

## 3. Create the Resend API key

1. In Resend, open **API Keys**.
2. Select **Create API Key**.
3. Name it `BatchMath Report Worker`.
4. Choose **Sending access**.
5. Restrict the key to the verified `batchmath.net` domain.
6. Create the key and copy the displayed `re_...` value immediately. Resend will not show the full key again.

Do not put this key in the website, GitHub, `wrangler.jsonc`, or any tracked file.

## 4. Deploy the revised Worker

Install Node.js if it is not already installed. In a terminal, open the extracted full-site folder and run:

```bash
cd cloudflare/report-problem-worker
npm install
npx wrangler login
npm run deploy
```

Approve the Cloudflare login in the browser. The included `wrangler.jsonc` updates the Worker named `batchmath-report-problem` and keeps these routes:

- `batchmath.net/api/report-problem*`
- `www.batchmath.net/api/report-problem*`

The existing `REPORT_RATE_LIMITER` binding remains configured for six reports per browser token per minute. The first deployment may return a setup error for report submissions until the three secrets in the next step are added.

## 5. Add the three Worker secrets in Cloudflare

1. In the Cloudflare dashboard, open **Workers & Pages**.
2. Select **batchmath-report-problem**.
3. Open **Settings → Variables and Secrets**.
4. Select **Add** and create each entry below with **Type: Secret**:

| Secret name | Value |
| --- | --- |
| `RESEND_API_KEY` | The `re_...` API key copied from Resend |
| `REPORT_TO_EMAIL` | `batchmath@outlook.com` |
| `REPORT_FROM_EMAIL` | `reports@batchmath.net` |

5. Select **Deploy** to save the new Worker version.

All three values stay in the Worker environment and are never returned to the browser.

## 6. Confirm the route

1. In **Workers & Pages → batchmath-report-problem**, open **Settings → Domains & Routes**.
2. Confirm both route patterns listed in Step 4 are present.
3. In **Websites → batchmath.net → DNS → Records**, confirm the records serving `batchmath.net` and `www` are still **Proxied** (orange cloud). The Worker route cannot intercept `/api/report-problem` on a DNS-only hostname.

No frontend endpoint change is needed. BatchMath already posts to the relative URL `/api/report-problem`.

## 7. Test the live report flow

1. Deploy the full website ZIP through the normal BatchMath process.
2. Open any live practice generator at `https://batchmath.net`.
3. Generate a problem and enter an answer.
4. Select **Report a Problem**, enter a short test description, and select **Send Report**.
5. Confirm the modal says **Report sent. Thank you.**
6. Confirm the message arrives at `batchmath@outlook.com` from `reports@batchmath.net` and contains the description, submitted answer, and complete diagnostic ticket.
7. In Resend, open **Emails** or **Logs** to confirm the accepted send if delivery needs investigation.

If BatchMath reports a failure, open **Workers & Pages → batchmath-report-problem → Observability → Logs** and repeat the test. The Worker deliberately returns only a generic error to the browser; its logs record a safe network/status category without exposing the API key or Resend response body.

## Updating the Worker later

After editing files in `cloudflare/report-problem-worker/`, run:

```bash
npm run deploy
```

The three Worker secrets remain configured unless they are explicitly replaced or deleted.

