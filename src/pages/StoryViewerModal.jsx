import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Trash2, Eye, Calendar } from "lucide-react";

function StoryViewerModal({ 
  userStories = [], // Grouped stories [{ username, full_name, avatar, stories: [...] }]
  initialUserIndex = 0,
  initialStoryIndex = 0,
  onClose,
  onStoryDeleted, // callback to notify parent
  onStoryViewed   // callback to notify parent
}) {
  const [currentUserIdx, setCurrentUserIdx] = useState(initialUserIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Viewers Drawer State
  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  
  const progressIntervalRef = useRef(null);
  const activeUser = userStories[currentUserIdx];
  const activeStory = activeUser?.stories?.[currentStoryIdx];
  const videoRef = useRef(null);
  
  const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const myUsername = myUserObj?.username || "";
  const isOwnStory = activeUser?.username?.toLowerCase() === myUsername.toLowerCase() || activeStory?.userId === myUserObj?.id;

  // Track viewed stories to prevent duplicate API requests in the same session
  const viewedStoriesTrackerRef = useRef(new Set());

  // Reset progress and handle story change
  useEffect(() => {
    setProgress(0);
    setShowViewers(false);
    
    if (activeStory) {
      // Mark as viewed if it's someone else's story and not viewed yet
      if (!isOwnStory && !viewedStoriesTrackerRef.current.has(activeStory.id)) {
        markStoryAsViewed(activeStory.id);
      }
    }
  }, [currentUserIdx, currentStoryIdx]);

  // Mark Story as Viewed API Call
  const markStoryAsViewed = async (storyId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    viewedStoriesTrackerRef.current.add(storyId);
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/${storyId}/view`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (onStoryViewed) {
          onStoryViewed(storyId, activeUser.username);
        }
      }
    } catch (err) {
      console.error("Error marking story as viewed:", err);
    }
  };

  // Progression Timer Effect
  useEffect(() => {
    if (!activeStory || isPaused || showViewers) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const duration = (activeStory.duration_seconds || 5) * 1000;
    const intervalTime = 50; // Update every 50ms
    const step = (intervalTime / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentUserIdx, currentStoryIdx, isPaused, showViewers]);

  // Handle Video element loaded/play/pause state
  useEffect(() => {
    if (activeStory?.type === "video" && videoRef.current) {
      if (isPaused || showViewers) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Video auto play error", e));
      }
    }
  }, [isPaused, showViewers, currentUserIdx, currentStoryIdx]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUserIdx, currentStoryIdx, userStories]);

  // Navigation handlers
  const handleNext = () => {
    if (!activeUser) return;
    
    if (currentStoryIdx < activeUser.stories.length - 1) {
      // Go to next story of the current user
      setCurrentStoryIdx(currentStoryIdx + 1);
    } else if (currentUserIdx < userStories.length - 1) {
      // Go to the first story of the next user
      setCurrentUserIdx(currentUserIdx + 1);
      setCurrentStoryIdx(0);
    } else {
      // No more stories, close viewer
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIdx > 0) {
      // Go to previous story of the current user
      setCurrentStoryIdx(currentStoryIdx - 1);
    } else if (currentUserIdx > 0) {
      // Go to the last story of the previous user
      const prevUserIdx = currentUserIdx - 1;
      const prevUser = userStories[prevUserIdx];
      setCurrentUserIdx(prevUserIdx);
      setCurrentStoryIdx(prevUser.stories.length - 1);
    } else {
      // At the very first story, reset progress to 0
      setProgress(0);
    }
  };

  // Delete Story API Call
  const handleDeleteStory = async () => {
    if (!activeStory) return;
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/${activeStory.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Trigger callback for parent update
        if (onStoryDeleted) {
          onStoryDeleted(activeStory.id, activeUser.username);
        }

        // Remove from local activeUser stories array
        const updatedStories = activeUser.stories.filter(s => s.id !== activeStory.id);
        
        if (updatedStories.length === 0) {
          // If no stories left for this user, remove this user or skip
          const updatedUserStories = [...userStories];
          updatedUserStories.splice(currentUserIdx, 1);
          
          if (updatedUserStories.length === 0) {
            onClose();
          } else {
            // Move to next user or previous if last
            const nextUserIdx = currentUserIdx >= updatedUserStories.length ? updatedUserStories.length - 1 : currentUserIdx;
            setCurrentUserIdx(nextUserIdx);
            setCurrentStoryIdx(0);
          }
        } else {
          // Keep same user, adjust index
          const nextStoryIdx = currentStoryIdx >= updatedStories.length ? updatedStories.length - 1 : currentStoryIdx;
          activeUser.stories = updatedStories;
          setCurrentStoryIdx(nextStoryIdx);
          setProgress(0);
        }
      } else {
        alert(data.message || "Failed to delete story.");
      }
    } catch (err) {
      console.error("Error deleting story:", err);
      alert("An error occurred while deleting the story.");
    }
  };

  // Fetch Viewers API Call
  const fetchViewers = async () => {
    if (!activeStory) return;
    
    setIsLoadingViewers(true);
    setShowViewers(true);
    setIsPaused(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoadingViewers(false);
      return;
    }

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/${activeStory.id}/viewers`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setViewersList(resJson.data || []);
      } else {
        setViewersList([]);
      }
    } catch (err) {
      console.error("Error fetching story viewers:", err);
      setViewersList([]);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const closeViewersDrawer = () => {
    setShowViewers(false);
    setIsPaused(false);
  };

  if (!activeUser || !activeStory) return null;

  // Format viewed timestamp
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " · " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get sticker emoji
  const getStickerEmoji = (stkId) => {
    const STICKER_MAP = {
      stk_party: "🎉",
      stk_love: "❤️",
      stk_fire: "🔥",
      stk_laugh: "😂",
      stk_rocket: "🚀",
      stk_cool: "😎"
    };
    return STICKER_MAP[stkId] || "";
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col md:flex-row items-center justify-center p-0 md:p-6 overflow-hidden select-none animate-[fadeIn_0.15s_ease-out]">
      
      {/* Desktop Chevron Left */}
      <button 
        onClick={handlePrev}
        className="hidden md:flex w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition mr-8 active:scale-95 disabled:opacity-30"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Main Story Player Container */}
      <div 
        className="w-full max-w-[420px] h-full md:h-[750px] md:rounded-3xl overflow-hidden relative flex flex-col justify-between bg-zinc-950 shadow-2xl border border-white/5"
        style={{
          backgroundColor: activeStory.type === "text" ? (activeStory.background_color || "#E91E8C") : "#000000"
        }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* PROGRESS BARS */}
        <div className="absolute top-4 left-0 right-0 z-30 px-3 flex gap-1.5">
          {activeUser.stories.map((story, idx) => {
            let widthVal = "0%";
            if (idx < currentStoryIdx) widthVal = "100%";
            else if (idx === currentStoryIdx) widthVal = `${progress}%`;

            return (
              <div key={story.id} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                  style={{ width: widthVal }}
                />
              </div>
            );
          })}
        </div>

        {/* HEADER INFORMATION */}
        <div className="absolute top-7 left-0 right-0 z-30 px-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pt-2 pb-6">
          <div className="flex items-center gap-3">
            <img 
              src={activeUser.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"} 
              alt="avatar" 
              className="w-9 h-9 rounded-full object-cover border border-white/40"
            />
            <div>
              <h4 className="text-white text-sm font-bold truncate max-w-[150px]">{activeUser.full_name || activeUser.username}</h4>
              <p className="text-white/60 text-[10px] font-semibold mt-0.5 uppercase tracking-wider">
                {new Date(activeStory.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStory.type === "video" && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            
            {isOwnStory && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStory();
                }}
                className="w-8 h-8 rounded-full bg-red-650/30 hover:bg-red-600/90 text-white flex items-center justify-center transition ml-1"
                title="Delete Story"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* STORY CONTENT AREA */}
        <div className="flex-1 flex items-center justify-center relative w-full h-full">
          
          {/* TAP NAVIGATION ZONES (MOBILE) */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-3/4 z-20" onClick={handleNext} />

          {/* RENDER BY TYPE */}
          {activeStory.type === "text" ? (
            /* TEXT STORY CONTENT */
            <div className="w-full px-8 text-center select-text z-10 flex flex-col justify-center items-center">
              <p 
                className="font-bold text-3xl leading-relaxed drop-shadow-md break-words max-w-full"
                style={{ color: activeStory.text_color || "#FFFFFF" }}
              >
                {activeStory.text_content}
              </p>
              
              {/* Sticker on Text Story */}
              {activeStory.sticker_id && (
                <div className="absolute top-1/4 animate-bounce text-7xl select-none">
                  {getStickerEmoji(activeStory.sticker_id)}
                </div>
              )}
            </div>
          ) : activeStory.type === "video" ? (
            /* VIDEO STORY CONTENT */
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                src={activeStory.mediaUrl}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                loop
                muted={isMuted}
              />
              
              {/* Text Overlay */}
              {activeStory.text_content && (
                <div className="absolute inset-x-6 bottom-24 text-center z-10 px-4 py-3 bg-black/45 backdrop-blur-[4px] rounded-2xl border border-white/5">
                  <p 
                    className="font-bold text-base leading-snug drop-shadow-sm text-white"
                    style={{ color: activeStory.text_color || "#FFFFFF" }}
                  >
                    {activeStory.text_content}
                  </p>
                </div>
              )}

              {/* Sticker Overlay */}
              {activeStory.sticker_id && (
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 animate-pulse text-6xl select-none drop-shadow-lg z-10">
                  {getStickerEmoji(activeStory.sticker_id)}
                </div>
              )}
            </div>
          ) : (
            /* IMAGE STORY CONTENT */
            <div className="w-full h-full relative">
              <img 
                src={activeStory.mediaUrl} 
                alt="Story content" 
                className="w-full h-full object-cover"
              />

              {/* Text Overlay */}
              {activeStory.text_content && (
                <div className="absolute inset-x-6 bottom-24 text-center z-10 px-4 py-3 bg-black/45 backdrop-blur-[4px] rounded-2xl border border-white/5">
                  <p 
                    className="font-bold text-base leading-snug drop-shadow-sm text-white"
                    style={{ color: activeStory.text_color || "#FFFFFF" }}
                  >
                    {activeStory.text_content}
                  </p>
                </div>
              )}

              {/* Sticker Overlay */}
              {activeStory.sticker_id && (
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 animate-pulse text-6xl select-none drop-shadow-lg z-10">
                  {getStickerEmoji(activeStory.sticker_id)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM: VIEWERS DRAWER BUTTON (OWN STORY ONLY) */}
        {isOwnStory && (
          <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fetchViewers();
              }}
              className="bg-black/50 hover:bg-black/85 backdrop-blur text-white text-xs font-bold py-2.5 px-6 rounded-full flex items-center gap-2 border border-white/10 shadow-lg active:scale-95 transition"
            >
              <Eye size={14} />
              <span>Seen by {activeStory.views_count || 0}</span>
            </button>
          </div>
        )}

        {/* VIEWERS DRAWER PANEL */}
        {showViewers && (
          <div 
            className="absolute inset-0 bg-black/60 z-40 transition-all duration-300 animate-[fadeIn_0.2s_ease]"
            onClick={closeViewersDrawer}
          >
            <div 
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-[2rem] border-t border-zinc-200 dark:border-zinc-800 p-6 max-h-[60%] flex flex-col justify-between shadow-2xl animate-[slideUp_0.25s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pull Bar */}
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={closeViewersDrawer} />

              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Eye size={18} className="text-red-500" />
                  <span className="font-extrabold text-base">Viewers ({viewersList.length})</span>
                </div>
                <button 
                  onClick={closeViewersDrawer}
                  className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Viewers list content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {isLoadingViewers ? (
                  <div className="flex items-center justify-center py-10 gap-2.5 text-zinc-400">
                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs font-bold">Loading viewers...</span>
                  </div>
                ) : viewersList.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-sm font-semibold flex flex-col items-center gap-2">
                    <span>👁️‍🗨️</span>
                    No views yet. Share your story with friends!
                  </div>
                ) : (
                  viewersList.map((item) => (
                    <div key={item.user.id} className="flex items-center justify-between gap-3 group animate-fadeIn">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img 
                          src={item.user.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-150 group-hover:text-red-500 transition-colors truncate">
                            {item.user.full_name || item.user.username}
                          </h5>
                          <p className="text-xs text-zinc-450 dark:text-zinc-500 truncate">@{item.user.username}</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 shrink-0 bg-zinc-50 dark:bg-zinc-800/80 py-1 px-2.5 rounded-lg flex items-center gap-1 border border-zinc-100 dark:border-zinc-800">
                        <Calendar size={10} />
                        {formatTime(item.viewedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Desktop Chevron Right */}
      <button 
        onClick={handleNext}
        className="hidden md:flex w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition ml-8 active:scale-95 disabled:opacity-30"
      >
        <ChevronRight size={28} />
      </button>

    </div>
  );
}

export default StoryViewerModal;
