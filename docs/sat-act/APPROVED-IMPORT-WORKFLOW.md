# Approve SAT/ACT website questions

## Each batch

1. In **Shorts**, open **Actions → Review SAT/ACT questions for the website → Run workflow**. Keep the branch GitHub selects and click **Run workflow** again. Open the finished run and click **Open the private review checklist**. [Open the Shorts workflow](https://github.com/batchmath/Shorts/actions/workflows/website-text-review.yml)
2. Read the problem, choices, correct answer, solution, and quality notes. For each question you want on the website, tick all four boxes under that question. Leave the boxes blank for questions you want to skip. Click **Close issue** as completed to send the checked questions for import.
3. Open the website import from the link GitHub adds to the checklist. Open the draft pull request linked in the import run summary. Check its list of questions and permanent links, and wait for **BatchMath QA** to pass. If an earlier batch still has an open website pull request, finish reviewing it before retrying the new import. [Open the website import workflow](https://github.com/batchmath/BatchMathSite/actions/workflows/sat-act-approved-import.yml)
4. When you separately decide to publish, click **Ready for review**, then use the website pull request’s **Merge** button and confirm. This starts the website update.
5. When your videos are live, use the **sat-act-import-review** download on the website import run. GitHub adds the attempt number to the download name. Add missing rows from **video-rows.csv** to the existing Google Sheet. Enter each YouTube URL and the verified explanation-start time in seconds, then set the row to **Published**.

If the source changed, start again at step 1. The checklist link is good for 30 days. If an import fails temporarily, open the failed run in **Actions**, click **Re-run jobs**, then **Re-run failed jobs**. If a checklist closed with missing boxes, click **Reopen issue**, finish the review, and close it again.

## One-time GitHub setup

1. After you approve the implementation, merge both implementation pull requests. In **Shorts → Settings → General → Default branch**, click the switch-branch button, select `claude/gifted-meitner-wrb2v3`, then click **Update** and confirm. This is the branch with the current questions, videos, and prior approvals. [Open Shorts settings](https://github.com/batchmath/Shorts/settings)
2. Open your GitHub avatar menu and choose **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Choose **batchmath** as the resource owner, set an expiration, and choose **Only select repositories**. Select **Shorts** only. Under **Repository permissions**, set **Contents** to **Read-only**, then click **Generate token**. [Open fine-grained tokens](https://github.com/settings/personal-access-tokens)
3. In **BatchMathSite → Settings → Secrets and variables → Actions → New repository secret**, enter `SAT_ACT_SHORTS_READ_TOKEN` as the name, paste the Shorts token in **Secret**, and click **Add secret**. Use **Update** if the secret already exists. [Open BatchMathSite Actions secrets](https://github.com/batchmath/BatchMathSite/settings/secrets/actions)
4. Generate a second fine-grained token the same way, selecting **BatchMathSite** only. Set **Actions**, **Contents**, and **Pull requests** to **Read and write**. Add this token as `SAT_ACT_SITE_PR_TOKEN` in **Actions secrets** in both **Shorts** and **BatchMathSite**. Enter the values directly in GitHub. [Open Shorts Actions secrets](https://github.com/batchmath/Shorts/settings/secrets/actions) · [Open BatchMathSite Actions secrets](https://github.com/batchmath/BatchMathSite/settings/secrets/actions)
5. In **BatchMathSite → Settings → Rules → Rulesets**, click **New ruleset → New branch ruleset**. Name it **Website QA**, set **Enforcement status** to **Active**, and under **Target branches** click **Add target → Include default branch**. Turn on **Require status checks to pass**, click **Add checks**, select the **qa** check from GitHub Actions, and click **Create**. This keeps the website merge button locked until BatchMath QA passes. [Open BatchMathSite rulesets](https://github.com/batchmath/BatchMathSite/settings/rules)

GitHub includes read-only metadata access with these tokens. The website token starts the import, opens the draft, and lets **BatchMath QA** start automatically. GitHub’s built-in workflow token would require another approval click for those pull request checks. [GitHub’s workflow trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)

## What GitHub checks

The private checklist is tied to one source revision, one set of review tools, and GitHub’s record of who submitted it. Only the Shorts owner can submit it. The importer rechecks the recorded approvals, the mathematics, and the source before assigning new permanent numbers. The website tests check the draft’s pages and browser behavior. Existing numbered questions and URLs are preserved. Questions whose tables or figures the website cannot display are held back.

Video review stays separate. Website checklists grant approval for website text only. The existing manual import still accepts older formal approval snapshots for authorized recovery.
