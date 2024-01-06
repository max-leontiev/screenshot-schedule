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

const scheduleURLs = new Set([
  "https://www.beartracks.ualberta.ca/psc/uahebprd/EMPLOYEE/HRMS/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_MY_CLASSES__EXAMS&PTPPB_GROUPLET_ID=ZSS_CLASS_SCHED&CRefName=ADMN_NAVCOLL_1",
  "https://www.beartracks.ualberta.ca/psc/uahebprd_7/EMPLOYEE/HRMS/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_MY_CLASSES__EXAMS&PTPPB_GROUPLET_ID=ZSS_CLASS_SCHED&CRefName=ADMN_NAVCOLL_1"
])

async function getCurrentTab() {
  return (await browser.tabs.query({active: true, lastFocusedWindow: true}))[0]
}

async function getBoundingRectAndTab() {
  const curTab = await getCurrentTab()
  if (!scheduleURLs.has(curTab.url)) return
  console.log("we are on the right page") // DEBUG
  const boundingRectData = await browser.scripting.executeScript({
    target: {
      tabId: curTab.id,
    },
    func: () => {
      const docElement = document.documentElement
      const iframe = document.getElementsByTagName("iframe")[0]
      if (iframe) {
        const table = iframe.contentDocument.getElementById("zssclasssched")
        return JSON.stringify({
          table: table.getBoundingClientRect(),
          iframe: iframe.getBoundingClientRect(),
          document: docElement.getBoundingClientRect()
        })
      }
    }
  }).then((results) => JSON.parse(results[0].result))
  // TODO: make it understand fall/winter/spring/summer terms

  // do a bunch of simple math to ensure that entire visible portion of the table is captured
  const minX = boundingRectData.document.x
  const maxX = boundingRectData.document.x + boundingRectData.document.width
  const minY = boundingRectData.document.y
  const maxY = boundingRectData.document.y + boundingRectData.document.height

  const absX = boundingRectData.table.x + boundingRectData.iframe.x
  const absY = boundingRectData.table.y + boundingRectData.iframe.y
  const topLeft = {
    x: Math.max(minX, absX),
    y: Math.max(minY, absY)
  }
  const bottomRight = {
    x: Math.min(maxX, absX + boundingRectData.table.width),
    y: Math.min(maxY, absY + boundingRectData.table.height)
  }
  const width = bottomRight.x - topLeft.x
  const height = bottomRight.y - topLeft.y

  console.log(boundingRectData, minX, maxX, minY, maxY, topLeft, bottomRight, width, height) // DEBUG
  const rect = {
    x: topLeft.x,
    y: topLeft.y,
    width: width,
    height: height
  }

  browser.runtime.sendMessage({ // send message to background script so it can do the screenshot
    msgType: "screenshot",
    tab: curTab,
    rect: rect
  })
}

document.getElementById("screenshot")
.addEventListener("click", getBoundingRectAndTab)

document.getElementById("download-btn")
.addEventListener("click", () => browser.runtime.sendMessage({ // send message to background script so it can do the screenshot
  msgType: "download"
}))

browser.runtime.onMessage.addListener((data) => {
  if (Object.hasOwn(data, "msgType")) {
    if (data.msgType === "enableButtons") {
      document.getElementById("download-btn").disabled = false
      document.getElementById("copy").disabled = false
    }
  }
});

// enable/disable buttons depending on context every time the popup is opened
window.addEventListener("load", async () => {
  console.log("loaded") // DEBUG
  const curTab = await getCurrentTab()
  if (scheduleURLs.has(curTab.url)) { // enable screenshotting if we are on a Bear Tracks page
    document.getElementById("screenshot").disabled = false
  } else { // disable otherwise
    document.getElementById("screenshot").disabled = true
  }

  const sending = browser.runtime.sendMessage({
    msgType: "checkIfImgExists"
  });
  sending.then((message) => {
    if (message.response) { // enable downloading/copying if a screenshot was previously taken
      console.log("enabling") // DEBUG
      document.getElementById("download-btn").disabled = false
      document.getElementById("copy").disabled = false
    } else { // disable downloading/copying if there is no screenshot
      console.log("disabling") // DEBUG
      document.getElementById("download-btn").disabled = true
      document.getElementById("copy").disabled = true
    }
  }, (e) => console.error(e))
})
