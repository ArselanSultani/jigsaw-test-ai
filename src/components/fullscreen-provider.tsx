import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void | Promise<void>;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
};

const FullscreenContext = createContext<{
  isFullscreen: boolean;
  message: string | null;
  enter: () => void;
  exit: (onlyIfOwned?: boolean) => void;
} | null>(null);

function currentFullscreenElement() {
  const doc = document as WebkitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const owned = useRef(false);
  const pending = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const update = () => {
      const active = currentFullscreenElement() !== null;
      setIsFullscreen(active);
      if (!active && !pending.current) owned.current = false;
    };
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    update();
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, []);

  const exit = useCallback((onlyIfOwned = false) => {
    if (Platform.OS !== "web") return;
    const leave = async () => {
      await pending.current;
      if (!currentFullscreenElement() || (onlyIfOwned && !owned.current)) return;
      const doc = document as WebkitDocument;
      const exitFullscreen = doc.exitFullscreen ?? doc.webkitExitFullscreen;
      if (!exitFullscreen) {
        setMessage("This browser cannot exit fullscreen from the app. Use the browser controls instead.");
        return;
      }
      try {
        await exitFullscreen.call(doc);
        owned.current = false;
        setMessage(null);
      } catch (error) {
        console.error("Could not exit fullscreen", error);
        setMessage("Could not exit fullscreen. Use the browser controls instead.");
      }
    };
    void leave();
  }, []);

  const enter = useCallback(() => {
    if (Platform.OS !== "web" || pending.current || currentFullscreenElement()) return;
    const element = document.documentElement as WebkitElement;
    const request = element.requestFullscreen ?? element.webkitRequestFullscreen;
    if (!request) {
      setMessage("Fullscreen is not supported by this browser. You can still play with the controls hidden.");
      return;
    }
    setMessage(null);
    try {
      const result = request.call(element);
      const task = Promise.resolve(result)
        .then(() => {
          owned.current = true;
        })
        .catch((error: unknown) => {
          console.error("Could not enter fullscreen", error);
          setMessage("Could not enter fullscreen. Try again from the game controls.");
        })
        .finally(() => {
          pending.current = null;
        });
      pending.current = task;
    } catch (error) {
      console.error("Could not enter fullscreen", error);
      setMessage("Could not enter fullscreen. Try again from the game controls.");
    }
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, message, enter, exit }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) throw new Error("Fullscreen controls require FullscreenProvider.");
  return context;
}
