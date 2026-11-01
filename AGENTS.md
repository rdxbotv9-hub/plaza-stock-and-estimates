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

- Keep replacement stock snapshots as valid JSON in `list/ALL_STOCK.json`, preserving duplicate supplier descriptions as `vendor`; this replaces removed rows and makes imports parse reliably.
- Set the Vercel Nitro target only in `vercel.json`'s build command and use the Bun lockfile; Lovable keeps its managed Worker target and Vercel installs the same dependency versions.
- Keep the Graceware photo catalogue separate from priced stock, with a static product manifest and CDN asset pointers; browsing stays independent of stock imports and external API availability.
