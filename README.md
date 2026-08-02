# Substack Footnote Reader (PWA & Android Share Target)

A clean, responsive mobile web reader designed specifically for Substack articles. It fixes footnote links by converting superscripts into interactive bottom-sheet popovers and smooth scroll/return anchors.

## Features
- **Android Share Target API**: Installed as a Progressive Web App (PWA) on Android, allowing direct sharing from Chrome or the Substack app.
- **Interactive Footnotes**: Tap any footnote superscript (`[1]`) to open a bottom popover instantly without jumping away from your reading position.
- **Jump & Smooth Return**: Scroll to bottom footnotes with a floating "↩ Back to reading position" button to return instantly.
- **Reader Customization**: Toggle Dark Mode, Sepia, and Font Sizes (Small / Medium / Large).
- **Zero-Setup Hosting**: Ready to deploy on Cloudflare Pages, Vercel, Netlify, or GitHub Pages.

## How to Install on Android
1. Deploy or host this web application (e.g., on Cloudflare Pages, Vercel, or GitHub Pages).
2. Open the URL in Chrome on your Android phone.
3. Tap the Chrome menu (`⋮`) -> **"Add to Home Screen"** (or **"Install App"**).
4. Whenever you read a Substack article in Chrome or the Substack app, tap **Share** -> select **Substack Reader**.
5. The article loads cleanly with fully working, interactive footnotes!
