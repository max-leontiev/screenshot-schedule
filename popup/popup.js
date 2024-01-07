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

// Constants
const scheduleURLs = new Set([
  "https://www.beartracks.ualberta.ca/psc/uahebprd/EMPLOYEE/HRMS/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_MY_CLASSES__EXAMS&PTPPB_GROUPLET_ID=ZSS_CLASS_SCHED&CRefName=ADMN_NAVCOLL_1",
  "https://www.beartracks.ualberta.ca/psc/uahebprd_7/EMPLOYEE/HRMS/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_MY_CLASSES__EXAMS&PTPPB_GROUPLET_ID=ZSS_CLASS_SCHED&CRefName=ADMN_NAVCOLL_1"
])

const screenshotBtn = document.getElementById("screenshot")
const screenshotNotifBtn = document.getElementById("screenshot-notif")
const downloadBtn = document.getElementById("download")
const copyBtn = document.getElementById("copy")

const screenshotNotifAnimation = [ { opacity: "1" }, { opacity: "0" }, ];
const screenshotNotifTiming = { duration: 1000, iterations: 1, };

const enablingButtonAnimation = [ { filter: "grayscale(0%) brightness(1.0)" }, ]
const enablingButtonTiming = { duration: 150, iterations: 1, };

// Function definitions
async function getCurrentTab() {
  return (await browser.tabs.query({active: true, lastFocusedWindow: true}))[0]
}

async function injectScheduleLocatorScript(curTab) {
  return browser.scripting.executeScript({
    target: {
      tabId: curTab.id,
    },
    func: () => {
      const docElement = document.documentElement
      const iframe = document.getElementsByTagName("iframe")[0]
      if (iframe) {
        const term = iframe.contentDocument.getElementById("DERIVED_REGFRM1_SSR_STDNTKEY_DESCR$11$")
          .innerText
          .split("|")[0]
          .slice(0, -1) // assume the following format: "Winter Term 2024 | Undergraduate | University of Alberta")
        const table = iframe.contentDocument.getElementById("zssclasssched")
        return JSON.stringify({
          document: docElement.getBoundingClientRect(),
          iframe: iframe.getBoundingClientRect(),
          table: table.getBoundingClientRect(),
          term: term
        })
      }
    }
  }).then((results) => JSON.parse(results[0].result))
}

function getBoundingRect(injectionResults) {
  // do a bunch of simple math to ensure that entire visible portion of the table is captured
  const minX = injectionResults.document.x
  const maxX = injectionResults.document.x + injectionResults.document.width
  const minY = injectionResults.document.y
  const maxY = injectionResults.document.y + injectionResults.document.height

  const absX = injectionResults.table.x + injectionResults.iframe.x
  const absY = injectionResults.table.y + injectionResults.iframe.y
  const topLeft = {
    x: Math.max(minX, absX),
    y: Math.max(minY, absY)
  }
  const bottomRight = {
    x: Math.min(maxX, absX + injectionResults.table.width),
    y: Math.min(maxY, absY + injectionResults.table.height)
  }
  const width = bottomRight.x - topLeft.x
  const height = bottomRight.y - topLeft.y

  // console.log(injectionResults, minX, maxX, minY, maxY, topLeft, bottomRight, width, height) // DEBUG
  const rect = {
    x: topLeft.x,
    y: topLeft.y,
    width: width,
    height: height
  }
  return rect
}

async function getScreenshotData() {
  const curTab = await getCurrentTab()
  if (!scheduleURLs.has(curTab.url)) return
  // console.log("we are on the right page") // DEBUG
  const injectionResults = await injectScheduleLocatorScript(curTab)
  const rect = getBoundingRect(injectionResults)

  browser.runtime.sendMessage({ // send message to background script so it can do the screenshot
    msgType: "screenshot",
    tab: curTab,
    rect: rect,
    term: injectionResults.term
  })
}

// Main code
screenshotBtn
.addEventListener("click", getScreenshotData)

downloadBtn
.addEventListener("click", () => browser.runtime.sendMessage({ // send message to background script so it can download the screenshot
  msgType: "download"
}))

copyBtn
.addEventListener("click", () => browser.runtime.sendMessage({ // send message to background script so it can copy the screenshot
  msgType: "copy"
}))

browser.runtime.onMessage.addListener((data) => {
  if (Object.hasOwn(data, "msgType")) {
    if (data.msgType === "screenshotTaken") { // after a screenshot is taken, enable downloading/copying
      screenshotNotifBtn.style.display = 'unset'

      const screenshotNotifDisappearing = screenshotNotifBtn.animate(screenshotNotifAnimation, screenshotNotifTiming)
      const downloadBtnEnabling = downloadBtn.animate(enablingButtonAnimation, enablingButtonTiming)
      const copyBtnEnabling = copyBtn.animate(enablingButtonAnimation, enablingButtonTiming)
      
      screenshotNotifDisappearing.onfinish = (event) => { screenshotNotifBtn.style.display = 'none' }
      downloadBtnEnabling.onfinish = (event) => { downloadBtn.disabled = false }
      copyBtnEnabling.onfinish = (event) => { copyBtn.disabled = false }
    }
  }
});

// enable/disable buttons depending on context every time the popup is opened
window.addEventListener("load", async () => {
  // console.log("loaded") // DEBUG
  const curTab = await getCurrentTab()
  if (scheduleURLs.has(curTab.url)) { // enable screenshotting if we are on a Bear Tracks page
    screenshotBtn.disabled = false
  } else { // disable otherwise
    screenshotBtn.disabled = true
  }

  const sending = browser.runtime.sendMessage({ // ask background script if a screenshot was previously taken
    msgType: "checkIfImgExists"
  });
  sending.then((message) => {
    if (message.response) { // enable downloading/copying if a screenshot was previously taken
      // console.log("enabling") // DEBUG
      downloadBtn.disabled = false
      copyBtn.disabled = false
    } else { // disable downloading/copying if there is no screenshot
      // console.log("disabling") // DEBUG
      downloadBtn.disabled = true
      copyBtn.disabled = true
    }
  }, (e) => console.error(e))
})
