/*
Screenshot Schedule
Copyright (C) 2024 Max Leontiev

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. 
If not, see <https://www.gnu.org/licenses/>. 
*/

const scheduleURL = "https://www.beartracks.ualberta.ca/psc/uahebprd/EMPLOYEE/HRMS/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_MY_CLASSES__EXAMS&PTPPB_GROUPLET_ID=ZSS_CLASS_SCHED&CRefName=ADMN_NAVCOLL_1"

async function getBoundingRectAndTab() {
  
  const curTab = (await browser.tabs.query({active: true, lastFocusedWindow: true}))[0]
  if (curTab.url !== scheduleURL) return
  console.log("we are on the right page")
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
  // do a bunch of simple math to ensure that entire visible portion of table is captured
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
    