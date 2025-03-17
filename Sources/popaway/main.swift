import Foundation
import SwiftCLI
import Cocoa

setbuf(__stdoutp, nil);

final class StartCommand: Command {
    let name = "popaway"

    @CollectedParam var titles: [String]

    func execute() throws {
        if !AXIsProcessTrustedWithOptions(["AXTrustedCheckOptionPrompt": true] as CFDictionary) {
            print("Please enable accessibility permissions")
            exit(1)
        }

        let app = NSApplication.shared
        let delegate = AppDelegate(titles: titles)
        app.delegate = delegate
        app.run()
    }
}

let popAway = CLI(singleCommand: StartCommand())

_ = popAway.go()
