import Cocoa
import Foundation
import ApplicationServices

func printJson(_ obj: Any) {
  do {
    print("j\(try toJson(obj))")
  } catch {
    print("{\"error\": \"Failed to serialize JSON\"}")
  }
}

var globalTitles: [String] = []

final class AppDelegate: NSObject, NSApplicationDelegate {
  var observer: AXObserver?

  init(titles: [String]) {
    globalTitles = titles
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    setupObserver()
  }

  func setupObserver() {
    let apps = NSWorkspace.shared.runningApplications
    guard let controlCenter = apps.first(where: { $0.localizedName == "Control Center" }) else {
        print("Failed to find Control Center")
        exit(1)
    }

    let appPID = controlCenter.processIdentifier
    let appRef = AXUIElementCreateApplication(appPID)

    let callback: AXObserverCallback = { observer, element, notification, refcon in
      // guard let refcon = refcon else {
      //   print("Failed to get refcon \(refcon)")
      //   return
      // }

      // let mySelf = Unmanaged<AppDelegate>.fromOpaque(refcon).takeUnretainedValue()
      var role: CFTypeRef?
      AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &role)

      let roleName = role as? String ?? "Unknown"

      if roleName != "AXPopover" {
        return
      }

      var popoverActions: CFArray?
      let popoverActionsResult = AXUIElementCopyActionNames(element, &popoverActions)

      if popoverActionsResult == .success {
        let windowActionsArray = popoverActions as! [String]
        if windowActionsArray.contains("AXCancel") {
          var textNodes: [String] = []

          func findTextNodes(_ element: AXUIElement) {
            var children: AnyObject?
            AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &children)

            if let children = children as? [AXUIElement] {
              for child in children {
                var role: CFTypeRef?
                AXUIElementCopyAttributeValue(child, kAXRoleAttribute as CFString, &role)

                if role as? String == "AXStaticText" {
                  var text: CFTypeRef?
                  AXUIElementCopyAttributeValue(child, kAXValueAttribute as CFString, &text)

                  if let text = text as? String {
                    textNodes.append(text)
                  }
                }

                findTextNodes(child)
              }
            }
          }

          findTextNodes(element)
          if let title = textNodes.first, globalTitles.contains(title) {
            let actionResult = AXUIElementPerformAction(element, kAXCancelAction as CFString)
            printJson(["content": textNodes, "closed": actionResult == .success])
          } else {
            printJson(["content": textNodes, "closed": false])
          }
        }
      } else {
        print("Failed to get window actions")
        exit(1)
      }
    }

    AXObserverCreate(controlCenter.processIdentifier, callback, &self.observer)

    if let observer = self.observer {
      AXObserverAddNotification(observer, appRef, kAXCreatedNotification as CFString, UnsafeMutableRawPointer(Unmanaged.passRetained(self).toOpaque()))
      CFRunLoopAddSource(CFRunLoopGetCurrent(), AXObserverGetRunLoopSource(observer), .defaultMode)
    } else {
      print("Failed to create observer")
      exit(1)
    }
  }
}