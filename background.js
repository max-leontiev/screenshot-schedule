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
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // remove any weird characters (not letter/number/dash/underscore/space)
    .substring(0, 200); // make sure file name isn't too long (a limit of up to 255 chars would probably be ok)
}

async function uriToURL(uri) {
  const blob = await (await fetch(uri)).blob();
  return URL.createObjectURL(blob);
}

async function dataUrlToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}

let last_image;
async function screenshot(tab, rect, term) {
  const imgURI = await browser.tabs.captureTab(tab.id, { rect: rect });
  // console.log(imgURI) // DEBUG
  const arrBuffer = await dataUrlToArrayBuffer(imgURI);
  // console.log(arrBuffer) // DEBUG
  const url = await uriToURL(imgURI);
  // console.log(url) // DEBUG
  try {
    const filename = stringToFilename(term + ' Schedule') + '.png'; // term string should already be a valid filename, but parse it just in case
    // console.log(filename) // DEBUG
    last_image = {
      url: url,
      filename: filename,
      arrBuffer: arrBuffer,
    };
    // console.log(last_image) // DEBUG
  } catch (e) {
    throw new Error(e); // do this so that the promise is rejected
  }
}

browser.runtime.onMessage.addListener((data, sender, sendResponse) => {
  switch (data.msgType) {
    case 'screenshot':
      screenshot(data.tab, data.rect, data.term).then(
        () => {
          sendResponse();
        },
        (error) => {
          console.error(error);
        }
      );
      break;
    case 'download':
      if (last_image) {
        browser.downloads
          .download({
            url: last_image.url,
            filename: last_image.filename,
            saveAs: true,
          })
          .then(
            (downloadId) => {
              sendResponse();
            },
            (error) => {
              console.error(error);
            }
          );
      }
      break;
    case 'copy':
      if (last_image) {
        browser.clipboard.setImageData(last_image.arrBuffer, 'png').then(
          () => {
            sendResponse();
          },
          (error) => {
            console.error(error);
          }
        );
        return true;
      }
      break;
    case 'checkIfImgExists':
      if (last_image) {
        sendResponse({ response: true });
      } else {
        sendResponse({ response: false });
      }
      break;
    default:
      throw new Error(`Invalid message data: ${data} (sent by ${sender})`);
  }
});
