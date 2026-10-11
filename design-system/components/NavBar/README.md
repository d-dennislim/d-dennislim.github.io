# NavBar

The page's sticky top bar: a terminal-prompt mark on the left (`jamie@portfolio:~$` — swap the username, keep the `$`, it's the whole joke), section links on the right, a 2px `brand` line underneath instead of a flat hairline so the bar reads as an active strip, not just a divider.

The consumer provides: the prompt text (your own handle) and a list of section links matching the page's actual sections.

Do:
- Mark the current section with `aria-current="page"` so the active-state underline (`brand`) shows without JS.
- Keep the prompt short — a real shell prompt is terse; `name@portfolio:~$` or `name@aws:~$`, not a full sentence.

Don't:
- Don't add a logo image here unless the portfolio has a real personal mark — the prompt mark is the identity, deliberately typographic.
- Don't exceed 5 links; a one-page portfolio has 3–4 sections at most.
