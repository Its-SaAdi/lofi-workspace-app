import { useState, useRef, useEffect, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { songs } from "../../conf/songsConf"
import { saveTrack, getStoredTracks, deleteStoredTrack } from "../../conf/musicStorageService"
import { setCurrentTrack, setIsPlaying, clearTrack, setCurrentTime, setIsShuffle, setScreen, setVolume } from '../../features/music/musicSlice'

// SCREEN CONSTANTS
const SCREEN = { LIBRARY: 'library', PLAYER: 'player' }

const MusicPlayer = () => {
    const dispatch = useDispatch()
    const {
        currentTrackId,
        currentIndex,
        isPlaying,
        currentTime: savedTime,
        progress,
        isShuffle,
        volume,
        screen,
    } = useSelector(state => state.music)

    // const [screen, setScreen] = useState(SCREEN.LIBRARY)
    const [tracks, setTracks] = useState(songs);
    // const [currentIndex, setCurrentIndex] = useState(null);
    // const [isPlaying, setIsPlaying] = useState(false);
    // const [isShuffle, setIsShuffle] = useState(false);
    // const [progress, setProgress] = useState(0);
    // const [volume, setVolume] = useState(0.7);
    const [lastVolume, setLastVolume] = useState(volume);
    const [duration, setDuration] = useState(0);
    const [searchQuery, setSearchQuery] = useState("")

    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    const didRestoreRef = useRef(false)

    const currentTrack = currentIndex !== null ? tracks[currentIndex] : null

    // Load persisted tracks
    useEffect(() => {
        const loadTracks = async () => {
            try {
                const stored = await getStoredTracks();
                if (stored.length) {
                    setTracks([...stored, ...songs]);
                }
            } catch (err) {
                console.error('Failed to load saved tracks', err);
            }
        };
        loadTracks();
    }, []);

    // Restore playback position on remount
    useEffect(() => {
        if (didRestoreRef.current) return
        if (!audioRef.current || !currentTrack) return

        audioRef.current.src = currentTrack.url
        audioRef.current.volume = volume

        const handleCanPlay = () => {
            if (didRestoreRef.current) return
            didRestoreRef.current = true

            if (savedTime > 0) {
                audioRef.current.currentTime = savedTime
            }

            // Resume playing only if it was playing before closing
            if (isPlaying) {
                audioRef.current.play().catch(() => dispatch(setIsPlaying(false)))
            }
        }

        audioRef.current.addEventListener('canplay', handleCanPlay, { once: true })

        return () => {
            audioRef.current?.removeEventListener('canplay', handleCanPlay)
        }
    }, [tracks])

    // Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Play / Pause Song
    useEffect(() => {
        if (!audioRef.current || !didRestoreRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(() => dispatch(setIsPlaying(false)));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);


    // ─── Save playback time to Redux periodically ─────────────────────
    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return

        const { currentTime, duration } = audioRef.current
        if (!duration) return

        dispatch(setCurrentTime({
            currentTime,
            progress: (currentTime / duration) * 100,
        }))
    }, [dispatch])

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration || 0)
    }

    const handleProgressChange = (e) => {
        if (!audioRef.current) return

        const value = parseFloat(e.target.value)
        audioRef.current.currentTime = (value / 100) * audioRef.current.duration

        dispatch(setCurrentTime({
            currentTime: audioRef.current.currentTime,
            progress: value,
        }))
    }

    // ─── Track selection (new song picked) ───────────────────────────
    const selectTrack = (index, trackOverride = null) => {
        didRestoreRef.current = true // already handled from here on
        const track = trackOverride ?? tracks[index]

        if (!track) {
            console.error("Track not found:", {
                index,
                tracksLength: tracks.length
            });
            return
        }

        dispatch(setCurrentTrack({ id: track.id, index }))
        dispatch(setIsPlaying(true))
        dispatch(setScreen(SCREEN.PLAYER))

        if (audioRef.current) {
            audioRef.current.src = track.url
            audioRef.current.volume = volume
            audioRef.current.play().catch(() => dispatch(setIsPlaying(false)))
        }
    }


    const togglePlay = () => dispatch(setIsPlaying(!isPlaying));

    // const handleTimeUpdate = () => {
    //     if (!audioRef.current) return;
    //     setProgress(
    //         (audioRef.current.currentTime / audioRef.current.duration) * 100 || 0
    //     );
    // };

    // const handleLoadedMetadata = () => {
    //     if (audioRef.current) {
    //         setDuration(audioRef.current.duration || 0);
    //     }
    // };

    // const handleProgressChange = (e) => {
    //     const newProgress = parseFloat(e.target.value);
    //     if (!audioRef.current) return;
    //     audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    //     setProgress(newProgress);
    // };

    const toggleMute = () => {
        if (volume > 0) {
            setLastVolume(volume);
            dispatch(setVolume(0));
        } else {
            dispatch(setVolume(lastVolume || 0.7));
        }
    };

    const nextTrack = useCallback(() => {
        if (currentIndex === null) return
        const nextIndex = isShuffle
            ? (() => {
                let next
                do { next = Math.floor(Math.random() * tracks.length) }
                while (next === currentIndex && tracks.length > 1)
                return next
            })()
            : (currentIndex + 1) % tracks.length
        selectTrack(nextIndex)
    }, [currentIndex, isShuffle, tracks])

    const prevTrack = () => {
        if (currentIndex === null) return
        selectTrack((currentIndex - 1 + tracks.length) % tracks.length)
    };

    // const selectTrack = (index) => {
    //     setCurrentIndex(index)
    //     setIsPlaying(true)
    //     setScreen(SCREEN.PLAYER)
    // }

    // Upload songs + random covers
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files?.length === 0) return;

        const newTracks = [];

        for (const file of Array.from(files)) {
            const id = Date.now().toString() + Math.random().toString(36).slice(2);
            const track = {
                id,
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Personal Collection',
                url: URL.createObjectURL(file),
                cover: `https://picsum.photos/seed/${id}/300/300`,
                isUserAdded: true
            };

            try {
                await saveTrack(track, file);
                newTracks.push(track);
            } catch (err) {
                console.error('Failed to save track', file.name, err);
            }
        }

        if (newTracks.length) {
            setTracks(prev => [...prev, ...newTracks])

            // The uploaded tracks begin at the old tracks.length
            const newTrackIndex = tracks.length

            // Pass the actual newly-created track so we don't
            // depend on tracks state being updated synchronously.
            selectTrack(newTrackIndex, newTracks[0])
        }

        e.target.value = ""
    };

    const removeTrack = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteStoredTrack(id);
            setTracks(prev => {
                const filteredTracks = prev.filter(track => track.id !== id)
                // Adjust current index if we deleted the current or a previous track
                const trackIdx = prev.findIndex(track => track.id === id);

                if (trackIdx === currentIndex) {
                    dispatch(clearTrack())
                    didRestoreRef.current = false
                } else if (trackIdx < currentIndex) {
                    dispatch(setCurrentTrack({ id: tracks[currentIndex].id, index: currentIndex - 1 }))
                }
                return filteredTracks;
            });
        } catch (err) {
            console.error("Failed to delete track", err);
        }
    };

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // Filter searched tracks list
    const filterQueriedTracks = tracks.filter(track => track.title.toLowerCase().includes(searchQuery.toLowerCase()) || track.artist.toLowerCase().includes(searchQuery.toLowerCase()))

    // Shared audio element
    const audioEl = (
        <audio
            ref={audioRef}
            // src={currentTrack.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={nextTrack}
        />
    )

    if (screen === SCREEN.LIBRARY) {
        return (
            <div className="flex flex-col h-full">
                {audioEl}
                <style>{`
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .spin-slow { animation: spin-slow 12s linear infinite; }
                    .spin-paused { animation-play-state: paused; }
                    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
                    .track-row { transition: background 0.15s ease, transform 0.1s ease; }
                    .track-row:hover { transform: translateX(2px); }
                    .search-input::placeholder { color: rgba(255,255,255,0.3); }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between px-2 py-1">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-white">Library</h2>
                        <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mt-0.5">{tracks.length} tracks</p>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
                </div>

                {/* Search */}
                <div className="px-1 py-3">
                    <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tracks…"
                            className="search-input flex-1 bg-transparent text-white text-sm outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-white/50 hover:text-red-500/60 transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Now Playing mini-bar (visible if something is playing) */}
                {currentTrack && (
                    <div
                        onClick={() => dispatch(setScreen(SCREEN.PLAYER))}
                        className="mx-1 mb-3 flex items-center gap-3 p-2 rounded-lg bg-white/10 border border-white/10 cursor-pointer hover:bg-white/20 transition-all group"
                    >
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <img src={currentTrack.cover} className={`w-full h-full rounded-full object-cover ${isPlaying ? 'spin-slow' : 'spin-slow spin-paused'}`} />
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" style={isPlaying ? { boxShadow: '0 0 6px white' } : {}} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-white">{currentTrack.title}</p>
                            <p className="text-[10px] text-white/60 truncate">{currentTrack.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={e => { e.stopPropagation(); togglePlay() }}
                                className="w-7 h-7 rounded-full bg-white hover:scale-105 flex items-center justify-center transition-all cursor-pointer"
                            >
                                {isPlaying
                                    ? <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    : <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                }
                            </button>
                            <svg className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Track List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-2 space-y-0.5">
                    {filterQueriedTracks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-white/80">
                            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
                            </svg>
                            <p className="text-md font-semibold italic">No tracks found!</p>
                        </div>
                    ) : (
                        filterQueriedTracks.map((track, idx) => {
                            const realIdx = tracks.indexOf(track)
                            const isActive = realIdx === currentIndex
                            return (
                                <div
                                    key={track.id}
                                    onClick={() => selectTrack(realIdx)}
                                    className={`track-row group flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer ${isActive ? 'bg-white/12 border border-white/10' : 'hover:bg-white/8'}`}
                                >
                                    {/* Track number / active indicator */}
                                    <div className="w-5 flex-shrink-0 flex items-center justify-center">
                                        {isActive && isPlaying
                                            ? <span className="flex gap-0.5 items-end h-4">
                                                {[0.3, 0.6, 0.45].map((d, i) => (
                                                    <span key={i} className="w-0.5 bg-pink-400 rounded-full animate-bounce" style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 0.15}s` }} />
                                                ))}
                                            </span>
                                            : <span className={`text-[12px] font-mono ${isActive ? 'text-white/70' : 'text-white/40 group-hover:text-white/60'}`}>
                                                {(realIdx + 1).toString().padStart(2, '0')}
                                            </span>
                                        }
                                    </div>

                                    {/* Cover */}
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <img src={track.cover} alt={track.title} className="w-full h-full rounded-lg object-cover" />
                                    </div>

                                    {/* Meta */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>{track.title}</p>
                                        <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                                    </div>

                                    {/* Duration / delete */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {track.duration && (
                                            <span className="text-[12px] text-white/50 font-mono">{track.duration}</span>
                                        )}
                                        {track.isUserAdded && (
                                            <button
                                                onClick={(e) => removeTrack(e, track.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-white hover:text-red-500 cursor-pointer transition-all rounded"
                                                title="Delete track"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 h-full">
            {audioEl}
            <style>
                {`@keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                    .animate-spin-slow {
                        animation: spin-slow 12s linear infinite;
                    }
                    .animate-spin-paused {
                        animation-play-state: paused;
                  }`}
            </style>

            {/* Top Bar: Back + Track Counter */}
            <div className="flex items-center justify-between px-1 pt-3 pb-2">
                <button
                    onClick={() => dispatch(setScreen(SCREEN.LIBRARY))}
                    className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold transition-all cursor-pointer group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                    </svg>
                    Library
                </button>
                {/* <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                    {currentIndex + 1} / {tracks.length}
                </span> */}
            </div>

            {/* Album Art */}
            <div className="relative group flex flex-col items-center text-center gap-2 px-4 pt-1 pb-1">
                <div className="relative w-48 h-48 flex items-center justify-center">

                    {/* Vinyl Background Shadow */}
                    <div className={`absolute inset-6 bg-black/40 rounded-full blur-xl transition-opacity duration-1000 ${isPlaying ? 'opacity-60' : 'opacity-20'}`} />

                    {/* Rotating Disk */}
                    <div className={`relative w-44 h-44 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 transition-transform duration-700 ${isPlaying ? 'scale-105 animate-spin-slow' : 'scale-100 animate-spin-slow animate-spin-paused'}`}>
                        <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-1 w-full mt-2">
                    <h3 className="text-xl font-semibold tracking-tight truncate px-4">{currentTrack.title}</h3>
                    <p className=" text-white/70 tracking-wide truncate handwritten text-lg">{currentTrack.artist}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 px-2 mt-1">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:accent-pink-200 transition-all"
                />
                <div className="flex justify-between text-[11px] text-white/50 font-mono tracking-tighter uppercase">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-2 my-2">
                <button
                    onClick={() => dispatch(setIsShuffle(!isShuffle))}
                    className={`transition-all hover:scale-110 cursor-pointer ${isShuffle ? 'text-pink-400' : 'text-white/50 hover:text-white'}`}
                    title="Shuffle"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 3h5v5m-5 13h5v-5M4 20L21 3m-6 13l6 6M4 4l5 5" />
                    </svg>
                </button>

                <div className="flex items-center gap-6">
                    <button onClick={prevTrack} className="hover:scale-110 transition-transform text-white/60 hover:text-white cursor-pointer">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 18V6z" /></svg>
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        {isPlaying ? (
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>
                    <button onClick={nextTrack} className="hover:scale-110 transition-transform text-white/60 hover:text-white cursor-pointer">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/50 hover:text-white transition-all hover:scale-110 cursor-pointer "
                    title="Add Tracks"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="audio/*"
                    multiple
                    onChange={handleFileUpload}
                />
            </div>

            {/* Volume Slider with Functional Icon */}
            <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full mx-1 mt-3">
                <button onClick={toggleMute} className="text-white/50 hover:text-white transition-all hover:scale-110 cursor-pointer ">
                    {volume === 0 ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                    ) : volume < 0.5 ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                    )}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                    className="flex-1 h-0.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white/50 hover:accent-white/70"
                />
            </div>

            {/* Mini Track List */}
            {/* <div className="mt-2 space-y-1 h-28 overflow-y-auto px-2 custom-scrollbar">
                {tracks.map((track, idx) => (
                    <div
                        key={track.id}
                        onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                        className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${idx === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <img src={track.cover} className="w-full h-full rounded-lg object-cover" />
                            {idx === currentIndex && isPlaying && <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full pulse-glow shadow-[0_0_8px_white]" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${idx === currentIndex ? 'text-white font-bold' : 'text-white/60'}`}>{track.title}</p>
                            <p className="text-[10px] text-white/40 truncate">{track.artist}</p>
                        </div>
                        {track.isUserAdded && (
                            <button
                                onClick={(e) => removeTrack(e, track.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 cursor-pointer transition-all"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                        {idx === currentIndex && <span className="text-[8px] text-white/60 font-mono font-bold">ACTIVE</span>}
                    </div>
                ))}
            </div> */}
        </div>
    )
}

export default MusicPlayer