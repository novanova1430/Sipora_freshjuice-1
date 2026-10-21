<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Roles live in `user_roles`; signup trigger `handle_new_user` assigns customer/seller from signup metadata (admin never assignable) — keeps privilege out of user-editable data.
- Ownership (seller edits only own products, users see only own cart/orders) is enforced by database row rules, not the UI — UI gates in `src/lib/guards.ts` are convenience only.
- Order totals are computed in the `place_order` database function from current prices — never trust client prices.
- Uploaded images go to the private `media` bucket and are shared via long-lived signed links (workspace blocks public buckets); licences go to private `licenses`.
- Protected pages (`/account`, `/cart`, `/seller/*`) use `ssr: false` + `requireRole` because the session lives in browser storage.
