# TODO

## 📋 To Do

- [ ] Finish writing README

## 🛠 In Progress

## ❌ Rejected

- Try using [html-to-image](https://www.npmjs.com/package/html-to-image) instead of using `tabs.captureTab`,
      since this requires `<all_urls>` on Firefox for no good reason ([source](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureTab)). 
  - **Reason for rejection:** Manifest V3 extensions cannot refer to external scripts ([source](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy)). In Manifest V2, a content security policy override can be manually added ([source](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)) for the html-to-image cdn. However, Manifest V2 is being phased out in both Firefox ([source](https://blog.mozilla.org/addons/2022/11/17/manifest-v3-signing-available-november-21-on-firefox-nightly/)) and Chrome ([source](https://developer.chrome.com/blog/resuming-the-transition-to-mv3)). Also, using this override would prevent the extension from being approved by Mozilla and listed on https://addons.mozilla.org ([source](https://stackoverflow.com/a/48493404)). Foregoing a cdn, the other option is to include the relevant code from html-to-image directly in this extension, but I think it's better to just ask for `<all_urls>` and use the `tabs` API.

## ✔️ Done

- [x] Properly attribute UI icons (see https://github.com/google/material-design-icons, at the bottom of the README)
- [x] Make copy button work
- [x] Add visual indication of successful copy and download (similar to the screenshot checkmark)
