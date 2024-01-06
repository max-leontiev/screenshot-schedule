/*
Screenshot Schedule - A Firefox extension for UAlberta students that helps you save your Bear Tracks schedule as an image.
Copyright (C) 2024 Max Leontiev

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. 
If not, see <https://www.gnu.org/licenses/>. 
*/

function stringToFilename(string) {
  return string
    .trim() // remove surrounding whitespace
    .replace(/[^a-zA-Z0-9-_ ]/g, "") // remove any weird characters (not letter/number/dash/underscore/space)
    .substring(0, 200); // make sure file name isn't too long (a limit of up to 255 chars would probably be ok)
}

function getTabFilename(tab) {
  if (tab.title) {
    transformedTitle = stringToFilename(tab.title);
    // console.log(transformedTitle) // DEBUG
    if (transformedTitle) return transformedTitle + ".png";
  }
  if (tab.url) {
    tabURL = new URL(tab.url);
    transformedURL = stringToFilename(tabURL.hostname.replace(/\./g, "_")); // replace dots in hostname with underscores
    // console.log(transformedURL) // DEBUG
    if (transformedURL) return transformedURL + ".png";
  }
  return tab.id.toString() + ".png"; // fallback: just use the tabid as the filename
}

async function uriToURL(uri) {
  const blob = await (await fetch(uri)).blob();
  return URL.createObjectURL(blob);
}

let last_image = undefined

async function screenshot(tab, rect) {
  const imgURI = await browser.tabs.captureTab(tab.id, { rect: rect });
  // console.log(imgURI) // DEBUG
  const url = await uriToURL(imgURI);
  // console.log(url) // DEBUG
  try {
    filename = getTabFilename(tab);
    // console.log(filename) // DEBUG
    last_image = {
      url: url,
      filename: filename,
    }
    console.log(last_image)
    // browser.downloads.download({ url: url, filename: filename, saveAs: true });
  } catch (e) {
    console.log(e);
  }
}

browser.runtime.onMessage.addListener((data, sender) => {
  if (Object.hasOwn(data, "msgType")) {
    switch (data.msgType) {
      case "screenshot":
        screenshot(data.tab, data.rect)
        break
      case "download":
        if (last_image) {
          browser.downloads.download({ url: last_image.url, filename: last_image.filename, saveAs: true });
        }
        break
    }
  }
});
