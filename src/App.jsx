import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { openWindow } from "./features/windows/windowSlice";
import { setWallpaperId } from "./features/wallpaper/wallpaperSlice";
import { BUILTIN_WALLPAPERS } from "./conf/wallpaperConf";
import { getCustomWallpapers } from "./conf/wallpaperStorageService";
import Clock from "./components/clock/Clock"
import Taskbar from "./components/taskbar/Taskbar"
import Window from "./components/window/Window"

function App() {
  // const [windowState, setWindowState] = useState([]);
  // let nextWindowId = 1;
  const dispatch = useDispatch()

  const windowState = useSelector((state) => state.win);
  const wallpaperId = useSelector((state) => state.wall.wallpaperId);

  const applyBackground = (url) => {
    document.getElementById("screen-bg").style.backgroundImage = `url(${url})`;
  }

  useEffect(() => {
    const hasSeenIntroScreen = localStorage.getItem("LOFI_WORKSPACE_INTRO_SEEN")

    if (hasSeenIntroScreen === "true") {
      return
    }

    dispatch(openWindow({
      id: "welcome",
      toolName: "Welcome",
      position: {
        xOffset: 500,
        yOffset: 30,
      }
    }))
  }, [dispatch])

  useEffect(() => {
    const savedId = localStorage.getItem("CURRENT_WALLPAPER_ID") || wallpaperId;

    const builtin = BUILTIN_WALLPAPERS.find(wallpaper => wallpaper.id === savedId);
    if (builtin) {
      applyBackground(builtin.full);
      dispatch(setWallpaperId(builtin.id))
      return;
    }

    getCustomWallpapers()
      .then(customWallpapers => {
        const custom = customWallpapers.find(wallpaper => wallpaper.id === savedId);
        if (custom) {
          applyBackground(custom.full);
        } else {
          // Saved ID no longer exists — fall back to default
          const fallback = BUILTIN_WALLPAPERS.find(wallpaper => wallpaper.id === "lofi-bg");
          applyBackground(fallback.full);
        }
      })
      .catch(() => {
        // On any error fall back to default
        const fallback = BUILTIN_WALLPAPERS.find(wallpaper => wallpaper.id === "lofi-bg");
        applyBackground(fallback.full);
      });

  }, [wallpaperId]);

  return (
    <div id='screen-bg' className='relative h-screen w-full overflow-hidden bg-cover bg-center bg-zinc-600 transition'>
      <Clock />

      {/* App will be here */}
      {windowState.windows.map((window) => (
        <Window windowData={window} key={window.id} />
        // <Window toolName={window.toolName} toolWidget={window.element} key={window.id} />
      ))}

      {/* <Window children={<h1>Hellow World</h1>} title="Design" onClose={closeWindow} /> */}

      <Taskbar />
    </div>
  )
}

export default App