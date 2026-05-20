import React, { useState, useEffect } from "react";
import { X, UserPlus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoryViewerModal from "./StoryViewerModal";

function LikersModal({ postId, isOpen, onClose }) {
  const navigate = useNavigate();
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});

  // Stories States
  const [activeStoryUsers, setActiveStoryUsers] = useState({});
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedUserFullName, setSelectedUserFullName] = useState("");
  const [selectedUserAvatar, setSelectedUserAvatar] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchStoriesFeed = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch("https://tiem.digitaligrow.com/api/v1/stories", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data)) {
          const userStoryMap = {};
          resJson.data.forEach(story => {
            const uName = story.User?.username;
            if (!uName) return;
            if (!userStoryMap[uName]) {
              userStoryMap[uName] = [];
            }
            userStoryMap[uName].push(story);
          });
          setActiveStoryUsers(userStoryMap);
        }
      } catch (err) {
        console.error("Error fetching stories for likers modal:", err);
      }
    };
    fetchStoriesFeed();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchLikers = async () => {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/${postId}/likes`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const resJson = await response.json();
        console.log("Likers API Response:", resJson);
        if (response.ok && resJson.success) {
          // Robustly extract the array, whether it's in data, data.likes, data.users, etc.
          let likersArray = [];
          if (Array.isArray(resJson.data)) {
            likersArray = resJson.data;
          } else if (resJson.data && Array.isArray(resJson.data.likes)) {
            likersArray = resJson.data.likes;
          } else if (resJson.data && Array.isArray(resJson.data.users)) {
            likersArray = resJson.data.users;
          } else if (Array.isArray(resJson.likes)) {
            likersArray = resJson.likes;
          }
          
          setLikers(likersArray);
          
          // Determine initial following state
          const myUserStr = localStorage.getItem("user");
          let myUsername = "";
          if (myUserStr) {
            try {
              myUsername = JSON.parse(myUserStr).username;
            } catch (e) {}
          }

          const initialStates = {};
          likersArray.forEach(item => {
            const u = item.User || item.user || item;
            if (u && u.username) {
              initialStates[u.username] = false; 
            }
          });
          setFollowingStates(initialStates);
        }
      } catch (err) {
        console.error("Error fetching likers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikers();
  }, [isOpen, postId]);

  const handleFollowToggle = async (targetUsername) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const currentlyFollowing = followingStates[targetUsername] || false;
    
    // Optimistic UI update
    setFollowingStates(prev => ({
      ...prev,
      [targetUsername]: !currentlyFollowing
    }));

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow`, {
        method: currentlyFollowing ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: { username: targetUsername }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        // Revert
        setFollowingStates(prev => ({
          ...prev,
          [targetUsername]: currentlyFollowing
        }));
      }
    } catch (err) {
      console.error(err);
      setFollowingStates(prev => ({
        ...prev,
        [targetUsername]: currentlyFollowing
      }));
    }
  };

  const handleUserClick = (username) => {
    onClose();
    localStorage.setItem("selected_username", username);
    navigate(`/profile/${username}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1b1b1b] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[zoomIn_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8"></div> {/* Spacer for centering */}
          <h2 className="font-bold text-lg text-black dark:text-white">Likes</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-black dark:hover:text-white rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            </div>
          ) : likers.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500 font-medium">
              No likes yet
            </div>
          ) : (
            likers.map((item, idx) => {
              const u = item.User || item.user || item;
              if (!u || !u.username) return null;
              
              const isMe = localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).username === u.username;
              const isFollowing = followingStates[u.username];

              return (
                <div key={u.id || idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer">
                  <div className="flex items-center gap-3" onClick={() => handleUserClick(u.username)}>
                    {(() => {
                      const stories = activeStoryUsers[u.username];
                      const hasStories = stories && stories.length > 0;
                      const hasUnviewed = hasStories && stories.some(s => s.is_viewed === false);
                      const avatarUrl = u.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

                      return (
                        <div 
                          onClick={(e) => {
                            if (hasStories) {
                              e.stopPropagation(); // prevent parent navigate click
                              setSelectedUserStories(stories);
                              setSelectedUsername(u.username);
                              setSelectedUserFullName(u.full_name || u.username);
                              setSelectedUserAvatar(avatarUrl);
                              setShowStoryViewer(true);
                            }
                          }}
                          className={`rounded-full flex items-center justify-center shrink-0 transition-transform ${
                            hasStories 
                              ? `p-[2px] cursor-pointer hover:scale-105 ${
                                  hasUnviewed 
                                    ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500" 
                                    : "bg-zinc-300 dark:bg-zinc-700"
                                }` 
                              : "border border-gray-200 dark:border-zinc-700"
                          }`}
                        >
                          <img 
                            src={avatarUrl} 
                            alt={u.username}
                            className={`w-11 h-11 rounded-full object-cover ${hasStories ? "border-2 border-white dark:border-[#1b1b1b]" : ""}`}
                          />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="font-bold text-[#2d1c1c] dark:text-white text-sm">{u.username}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[120px]">{u.full_name || u.username}</div>
                    </div>
                  </div>
                  
                  {!isMe && (
                    <button 
                      onClick={() => handleFollowToggle(u.username)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                        isFollowing 
                          ? "bg-gray-200 dark:bg-zinc-700 text-black dark:text-white hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" 
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      {/* Story Viewer Modal */}
      {showStoryViewer && selectedUserStories.length > 0 && (
        <StoryViewerModal
          userStories={[{
            username: selectedUsername,
            full_name: selectedUserFullName,
            avatar: selectedUserAvatar,
            stories: selectedUserStories
          }]}
          initialUserIndex={0}
          initialStoryIndex={0}
          onClose={() => setShowStoryViewer(false)}
          onStoryViewed={(storyId) => {
            setSelectedUserStories(prev => prev.map(s => s.id === storyId ? { ...s, is_viewed: true } : s));
            setActiveStoryUsers(prev => {
              const updated = { ...prev };
              if (updated[selectedUsername]) {
                updated[selectedUsername] = updated[selectedUsername].map(s => s.id === storyId ? { ...s, is_viewed: true } : s);
              }
              return updated;
            });
          }}
        />
      )}
      </div>
    </div>
  );
}

export default LikersModal;
