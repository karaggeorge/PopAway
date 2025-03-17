<p align="center">
  <img src="https://github.com/user-attachments/assets/084730de-c8bc-4514-8b1c-ae88ca93f164" height="64">
  <h3 align="center">PopAway</h3>
  <p align="center">Automatically dismiss macOS Control Center popups like `Turn On Reactions` until Apple fixes 🙄<p>
</p>

### Why?

Because I'm tired of this:

![CleanShot 2025-03-13 at 11 10 25@2x](https://github.com/user-attachments/assets/bbdfcc0c-9e6c-4151-bf15-e5e94f600486)

#### Why Electron

I originally just had a small swift script I was running locally, but figured I'd share so more people can use this. I tried to start building this as a native macOS using Swift/SwiftUI, but it was taking too long. This way, I was able ot use https://v0.dev to generate the UI quickly and just had to connect it to the background task.

If you want something smaller, feel free to use the [CLI](#cli) instead, although it's a bit more manual

### How?

Uses the macOS Accessibility API to listen for any popups created by the Control Center and then dismisses them

By default it only closes the `Turn On Reactions` popups, but it will keep track of any that it sees and you can add them to the blocklist

### Usage

When you first start the app, you just have to allow the system Accessibility permission, and optionally toggle `Start at Login`

You can then close the window, and the app will just run in the background.

To bring back the settings window, just activate the app again (re-open it)

![CleanShot 2025-03-17 at 18 56 14](https://github.com/user-attachments/assets/82c3e085-0023-41aa-9cb3-e13258ef0385)

#### CLI

If you would rather just use the CLI, you can run the same thing via:
```
npx apple-plz-stop
```

### Features/Bugs

Feel free to report any bugs, the window has two buttons to get the history and logs. Providing those will help with any debugging

As for features, I'm not planning on adding much to this, since I'm hoping Apple will fix soon, but some I considered:
- Adding an optional menu bar icon
- Allowing custom regex for popup title matching
