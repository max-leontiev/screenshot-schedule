# Screenshot Schedule

A Firefox extension for UAlberta students that helps you save your Bear Tracks schedule as an image.

## Installation

This extension is not yet available on [Mozilla's add-on browser](https://addons.mozilla.org/en-CA/firefox/). 

To run a temporary installation for development/testing purposes, follow [this guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) by Mozilla (copied here for convenience):
- clone this repo
- open Firefox
- enter `about:debugging` in the URL bar
- click "This Firefox"
- click "Load Temporary Add-on"
- open the extension's directory and select any file inside the extension

The extension will be installed, and it will remain installed until you remove it or restart Firefox.

#### IMPORTANT note:
In order to work, this extension ***requires*** the `<all_urls>` permission, which (at the moment) must be enabled manually. For a discussion of why this far-reaching permission is required, see the [Permissions section](#permissions). To grant this permission, first install the extension as described above, and then do the following:
- open Firefox
- enter `about:addons` in the URL bar
- select "Screenshot Schedule", which should be in the list of "Enabled" extensions.
- select "Permissions"
- under the "Optional permissions for added functionality" section, enable "Access your data for all websites". As described the [Permissions section](#permissions) of this README, the only reason this is needed is because of a limitation of Firefox's `tabs` API, since the extension doesn't actually need access to any website but Beartracks.

## Usage

- Login to https://www.beartracks.ualberta.ca and open the home page
- Click on "My Schedule & Exams"
- Follow the prompt to "Select a term then select Continue."
- At this point, you should see your schedule for the selected academic term. Make sure the entire schedule is visible in your browser, and then click on the "Screenshot Schedule" extension in the top right of your browser. Then, click the "Screenshot Schedule" button.
- Now, the "Copy" and "Download" buttons will be enabled, allowing you to copy an image of your schedule or save it for later.
- You can repeat the same procedure for other academic terms (or the same term), in which case the "Copy" and "Download" buttons will let you copy/download the most recent screenshot that was taken.

## Permissions

This extension requires the `activeTab` and `scripting` permissions in order to access the contents of the Beartracks page when you use the extension, and then run a script to capture that portion of the screen.
The `downloads` permission is required to allow downloading the screenshot, and the `clipboardWrite` permission is required to allow copying the screenshot to the clipboard.

This extension also requires the `<all_urls>` permission, even though it only functions on the Beartracks website. This is because of the limitations of Firefox's `tabs` API, which has a `captureTab()` method that does not work with the `activeTab` permission and instead requires `<all_urls>` ([source](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureTab)), regardless of which tabs are actually captured. 
There is an open Bugzilla bug tracking this issue [here](https://bugzilla.mozilla.org/show_bug.cgi?id=1784920). This behaviour differs from Chrome's `chrome.tabs` API, where the `captureVisibleTab()` method can be used with the `activeTab` permission ([source](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab)).

## Alternatives

You could just take a regular screenshot and crop it manually, either using your operating system's regular screenshot utility or [Firefox's built-in screenshot utility](https://support.mozilla.org/en-US/kb/take-screenshots-firefox). In my opinion, using this extension is more convenient, especially because Beartracks shows the schedule in an `<iframe>` HTML element, preventing Firefox's screenshot utility from letting you directly select the schedule `<table>`.

## License

Material Design icons are property of Google, released under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

This project is licensed under the GPLv3 License - see the [LICENSE.txt](LICENSE.txt) file for details.\
Copyright © 2024 Max Leontiev
