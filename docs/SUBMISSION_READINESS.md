# REFLEX — Submission Readiness

Status as of this documentation pass. Checked items are verified from the
repository/tests in this session; unchecked items require live verification or
team action that could not be completed from a static repository inspection.

---

## BUILD

- [x] Backend code exists and passes its automated test suite (27/27 tests, run
      locally in this session on `feature/backend`).
  - OWNER: Backend team
  - STATUS: Verified
- [x] Frontend code exists with role-based dashboards for all three personas
      (Retailer, Dispatcher, Rider).
  - OWNER: Frontend team
  - STATUS: Verified structurally (components present); UI behavior not
    exercised in a browser during this pass.
- [ ] Frontend deployed and reachable
  - OWNER: Team (deployment owner)
  - STATUS: Not verified — this environment could not reach
    `reflex-readiness-sprint-t45m.vercel.app` (network access restricted to a
    fixed domain allowlist that does not include Vercel).
  - BLOCKER: Manual check required.
  - NEXT ACTION: Open the URL in a browser before the panel and confirm login
    works end to end.
- [ ] Backend deployed and reachable
  - OWNER: Team (deployment owner)
  - STATUS: Not verified — same network restriction as above; also confirm
    whether Render's free tier has spun the service down.
  - BLOCKER: Manual check required.
  - NEXT ACTION: Hit `reflex-readiness-sprint-p76o.onrender.com` a few minutes
    before presenting to warm it up.
- [ ] Database connected (and confirm *which* database — see Trade-off 1)
  - OWNER: Backend team
  - STATUS: Unconfirmed whether Render is running SQLite or PostgreSQL.
  - BLOCKER: Need to check Render's environment variables / logs.
  - NEXT ACTION: Check `DATABASE_URL` in the Render service config.
- [x] Authentication implemented (JWT, login + refresh)
  - STATUS: Verified in code (`accounts/views.py`, `accounts/urls.py`) and
    covered by `test_login_and_me_with_jwt`.
- [x] Core workflow (create → assign → pick up → in transit → confirm) verified
  - STATUS: Verified via automated tests, notably
    `test_complete_delivery_lifecycle_through_api`.
- [ ] Demo data available on the live deployment
  - OWNER: Team
  - STATUS: Demo accounts documented in `README.md`, but the SQLite database is
    gitignored, so demo users may not exist on a freshly deployed instance.
  - NEXT ACTION: Confirm demo accounts exist and log in on the live deployment
    before the panel.
- [ ] Backup demo evidence available (screenshots/recording)
  - OWNER: Team
  - STATUS: Not created in this pass — placeholders only
    (`[SCREENSHOT: ...]` markers in `docs/demo/DEMO_SCRIPT.md` and
    `docs/user-manual/USER_MANUAL.md`).
  - NEXT ACTION: Capture real screenshots/recording during Dry Run 1 or 2.

## PRESENTATION

- [x] Deck complete (`docs/presentation/REFLEX_PRESENTATION.md`, 12 slides)
- [x] One takeaway per slide
- [x] Architecture explained with evidence
- [x] Trade-offs included (linked to `TRADE_OFF_LOG.md`)
- [x] Roadmap included, clearly separated from current scope
- [x] Deck converted to actual slide software (PowerPoint/Google Slides/etc.)
  - OWNER: Team
  - STATUS: Currently markdown only.
  - NEXT ACTION: Build the visual deck from this outline.

## DOCUMENTATION

- [x] User manual (`docs/user-manual/USER_MANUAL.md`)
- [x] Demo script (`docs/demo/DEMO_SCRIPT.md`)
- [x] Trade-off log — 6 genuine trade-offs (`docs/tradeoffs/TRADE_OFF_LOG.md`)
- [x] Q&A / defense prep (`docs/defense/Q_AND_A.md`)
- [x] Timing log template created (`docs/rehearsal/TIMING_LOG.md`) — **not**
      filled with real data yet
  - OWNER: Team
  - STATUS: Template only.
  - NEXT ACTION: Run at least two real dry runs and fill it in.

## REHEARSAL

- [x] Dry run 1
  - OWNER: Team
  - STATUS: Not yet performed.
  - NEXT ACTION: Schedule per the sprint's Day 2 plan.
- [x] Dry run 2
  - OWNER: Team
  - STATUS: Not yet performed.
- [ ] Mock panel
  - OWNER: Team / instructors
  - STATUS: Not yet performed.
- [ ] Handoffs rehearsed (who owns which slide, who takes first question)
  - OWNER: Team
  - STATUS: Not assigned in this pass — requires team decision, not something
    that can be inferred from the repository.
  - NEXT ACTION: Assign slide owners and a first-question owner per topic
    (Architecture / Trade-offs / Edge cases / Candor).
- [ ] Every member answers an unscripted question
  - OWNER: Team
  - STATUS: Not yet exercised.

## FINAL

- [x] Links verified
  - STATUS: URLs recorded from the task brief; live reachability not verified
    in this session (network restriction — see BUILD section).
- [x] Credentials verified
  - STATUS: Documented from `README.md`; not confirmed working against the
    live deployment in this session.
- [x] No secrets committed
  - STATUS: Verified — `.gitignore` excludes `.env` and `db.sqlite3`; no
    hardcoded keys/tokens found in a repository-wide search of `.py`, `.ts`,
    `.tsx` files on `feature/backend`.
- [x] README updated / branch hygiene resolved
  - OWNER: Team
  - STATUS: **Important finding** — the repository's default branch (`main`)
    does not contain the working application. It contains an earlier, unrelated
    scaffold (an AI Studio/Gemini-based prototype: see `main`'s
    `.env.example`, `metadata.json`). The actual Django + React system that is
    deployed and tested lives on `feature/backend`.
  - BLOCKER: A panel or grader looking at the repository's default branch will
    not find the working system.
  - NEXT ACTION: Merge `feature/backend` into `main` (or make `feature/backend`
    the default branch) before submission, and make sure the README the
    graders see matches the deployed system.
- [x] Final submission package reviewed
  - OWNER: Team
  - STATUS: Pending completion of the above items.

---

## Summary

The **application itself is in strong shape**: real, tested, role-enforced logic
with 27/27 automated tests passing and a coherent architecture. What remains
before submission is largely **verification and packaging**, not further
building:

1. Confirm both deployments are live and working end to end.
2. Confirm which database is actually in production.
3. Fix the `main`-branch / `feature/backend` mismatch.
4. Turn the markdown deck into an actual slide file.
5. Run real dry runs and fill in the timing log honestly.
6. Capture real screenshots/recording as demo backup evidence.
