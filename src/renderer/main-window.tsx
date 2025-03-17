import { useEffect, useState } from "react"
import { Button } from "./components/ui/button"
import { Switch } from "./components/ui/switch"
import { Card, CardContent } from "./components/ui/card"
import { ScrollArea } from "./components/ui/scroll-area"
import { CircleCheckBig, Folder, Power } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip"

interface Popup {
  count: number;
  last: number;
  contents: string[];
  blocking: boolean;
  blocked: number;
}

interface Main {
  startAtLogin: Promise<boolean>;
  setStartAtLogin: (value: boolean) => void;
  getStore: () => {
    popups: Record<string, Popup>;
  };
  setStore: (key: string, value: unknown) => void;
  openHistoryFile: () => void;
  getAccessibilityPermission: () => Promise<boolean>;
  requestAccessibility: () => void;
  onFocus: (callback: () => void) => void;
  ready: () => void;
}

interface MainState {
  startAtLogin: boolean;
  showTrayIcon: boolean;
  popups: Record<string, Popup>;
  hasAccessibility: boolean;
}

export default function MainWindow() {
  console.log(window.main);
  const main = (window as unknown as {main: Main}).main;

  const [state, setState] = useState<MainState>({
    startAtLogin: true,
    showTrayIcon: true,
    popups: {},
    hasAccessibility: false,
  });

  useEffect(() => {
    return main.onFocus(() => {
      main.getAccessibilityPermission().then(value => {
        setState(prevState => ({ ...prevState, hasAccessibility: value }));
      })
    });
  }, []);

  useEffect(() => {
    (async () => {
      setState({
        startAtLogin: await main.startAtLogin,
        hasAccessibility: await main.getAccessibilityPermission(),
        showTrayIcon: false,
        popups: main.getStore().popups,
      })

      requestAnimationFrame(() => {
        main.ready();
      });
    })();
  }, [])

  const popups = Object.entries(state.popups).map(([title, popup]) => ({ title, ...popup }));

  const handleOpenHistoryFile = () => {
    main.openHistoryFile();
  }

  const togglePopup = (title: string) => {
    main.setStore(`popups.${title}.blocking`, !state.popups[title].blocking);
    setState(prevState => ({
      ...prevState,
      popups: {
        ...prevState.popups,
        [title]: {
          ...prevState.popups[title],
          blocking: !prevState.popups[title].blocking,
        }
      }
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 p-6 w-screen mx-auto dark drag">
      {/* Logo and Title Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-950 to-purple-900 flex items-center justify-center mb-4">
          <Power className="w-12 h-12 text-blue-300" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-200">PopAway</h1>
        <p className="text-sm text-zinc-400 text-center mt-2">
          Automatically dismiss macOS Control Center popups
        </p>
      </div>

      {/* Settings Section */}
      <Card className="w-full border-zinc-800 bg-zinc-900/70 no-drag">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* A11y */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-300">Accessibility Permissions</p>
                <p className="text-sm text-zinc-500">Required to detect and close the popups</p>
              </div>
              {
                state.hasAccessibility ? (
                  <CircleCheckBig className="w-6 h-6 text-green-400" />
                ) : (
                    <Button
                    variant="outline"
                    className="bg-amber-900/20 hover:bg-amber-800/30 text-amber-200 border-amber-800 px-4 py-2 h-auto"
                    onClick={main.requestAccessibility}
                    >
                    Allow
                    </Button>
                )
              }
              {

              }
              {/* <Switch
                checked={state.startAtLogin}
                onCheckedChange={value => {
                  main.setStartAtLogin(value);
                  setState(prevState => ({ ...prevState, startAtLogin: value }));
                }}
                aria-label="Toggle start at login"
                className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-800"
              /> */}
            </div>

            {/* Start at Login Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-300">Start at Login</p>
                <p className="text-sm text-zinc-500">Launch PopAway when you log in</p>
              </div>
              <Switch
                checked={state.startAtLogin}
                onCheckedChange={value => {
                  main.setStartAtLogin(value);
                  setState(prevState => ({ ...prevState, startAtLogin: value }));
                }}
                aria-label="Toggle start at login"
                className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-800"
              />
            </div>

            {/* Show Tray Icon Toggle */}
            {/* <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-300">Show in Menu Bar</p>
                <p className="text-sm text-zinc-500">Display PopAway icon in the menu bar</p>
              </div>
              <Switch
                checked={showTrayIcon}
                onCheckedChange={setShowTrayIcon}
                aria-label="Toggle tray icon"
                className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-800"
              />
            </div> */}

            {/* Closed Popups List */}
            <div>
              <p className="font-medium text-zinc-300 mb-2">Popups</p>
              <Card className="bg-zinc-900/30 border-zinc-800">
                <ScrollArea className="h-[180px] rounded-md">
                  {popups.length > 0 ? (
                    <div className="p-4 space-y-2">
                      <TooltipProvider>
                        {popups.map((popup) => (
                          <div
                            key={popup.title}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800/70 cursor-pointer transition-colors"
                            onClick={() => togglePopup(popup.title)}
                            role="checkbox"
                            aria-checked={popup.blocking}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                togglePopup(popup.title)
                                e.preventDefault()
                              }
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-zinc-300">{popup.title}</span>
                                  <span className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full">
                                    {popup.count}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col">
                                {popup.contents.map(item => {
                                  return <p className="max-w-[250px] truncate">{item}</p>
                                })}
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={popup.blocking}
                                onChange={() => togglePopup(popup.title)}
                                className="h-4 w-4 rounded border-zinc-600 text-blue-700 focus:ring-blue-700 focus:ring-opacity-25 bg-zinc-800"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        ))}
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-zinc-500">No popups have been dismissed yet</div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* Open History File Button */}
            <Button
              variant="outline"
              className="w-full border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
              onClick={handleOpenHistoryFile}
            >
              <Folder className="w-4 h-4 mr-2" />
              Open History File
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-auto pt-4 flex flex-col items-center gap-3 no-drag">
        <Button
          variant="outline"
          className="bg-amber-900/20 hover:bg-amber-800/30 text-amber-200 border-amber-800/50 px-4 py-2 h-auto flex items-center gap-2"
          onClick={() => window.open("https://github.com/sponsors/karaggeorge?frequency=one-time", "_blank")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-coffee"
          >
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
            <line x1="6" x2="6" y1="2" y2="4"></line>
            <line x1="10" x2="10" y1="2" y2="4"></line>
            <line x1="14" x2="14" y1="2" y2="4"></line>
          </svg>
          Buy me a coffee
        </Button>
        <div className="text-center text-xs text-zinc-500">
          <div>PopAway v1.0.0 • © 2025</div>
          <div className="mt-1">
            Made by{" "}
            <a
              href="https://github.com/karaggeorge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              @gkaragkiaouris
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

