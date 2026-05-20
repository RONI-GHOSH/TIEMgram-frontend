import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  UserPlus,
} from "lucide-react";
import StoryViewerModal from "./StoryViewerModal";

function FollowModal({
  isOpen,
  onClose,
  defaultTab = "followers",
  username,
  setCurrentView
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
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
        console.error("Error fetching stories for modal:", err);
      }
    };
    fetchStoriesFeed();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen || !username) return;

    const fetchConnections = async () => {
      setLoading(true);
      setUsers([]);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const endpoint = activeTab === "requests" 
          ? `https://tiem.digitaligrow.com/api/v1/users/me/follow-requests`
          : `https://tiem.digitaligrow.com/api/v1/users/${username}/${activeTab}`;
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const json = await response.json();
        if (response.ok && json.success) {
          setUsers(json.data || []);
          
          // Set initial follow state values
          const initialStates = {};
          (json.data || []).forEach(u => {
            const uName = u.username || u.user?.username || "";
            initialStates[uName] = activeTab === "following";
          });
          setFollowingStates(prev => ({ ...prev, ...initialStates }));
        }
      } catch (err) {
        console.error(`Error loading ${activeTab}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [isOpen, username, activeTab]);

  // Fetch current user's active following status to dynamically match follow states
  useEffect(() => {
    if (!isOpen || !username || users.length === 0) return;

    const checkFollowingStatus = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
        const myUsername = myUserObj?.username || "";
        if (!myUsername) return;

        const myFollowingRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${myUsername}/following`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const myFollowingJson = await myFollowingRes.json();
        if (myFollowingRes.ok && myFollowingJson.success && Array.isArray(myFollowingJson.data)) {
          const myFollowingSet = new Set(myFollowingJson.data.map(u => (u.username || u.user?.username || "").toLowerCase()));
          const newStates = {};
          users.forEach(u => {
            const uName = (u.username || u.user?.username || "").toLowerCase();
            newStates[u.username || u.user?.username] = myFollowingSet.has(uName);
          });
          setFollowingStates(prev => ({ ...prev, ...newStates }));
        }
      } catch (err) {
        console.error("Error matching following status:", err);
      }
    };

    checkFollowingStatus();
  }, [isOpen, activeTab, users]);

  const toggleFollow = async (targetUsername, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const isCurrentlyFollowing = followingStates[targetUsername] || false;
    
    // Optimistic UI toggle
    setFollowingStates(prev => ({
      ...prev,
      [targetUsername]: !isCurrentlyFollowing
    }));

    try {
      const method = isCurrentlyFollowing ? "DELETE" : "POST";
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow`, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: {
            username: targetUsername
          }
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        // Rollback
        setFollowingStates(prev => ({
          ...prev,
          [targetUsername]: isCurrentlyFollowing
        }));
      }
    } catch (err) {
      console.error("Error toggling follow inside modal:", err);
      // Rollback
      setFollowingStates(prev => ({
        ...prev,
        [targetUsername]: isCurrentlyFollowing
      }));
    }
  };

  const handleAcceptRequest = async (targetUsername, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ params: { username: targetUsername } })
      });
      if (response.ok) {
        setUsers(prev => prev.filter(u => (u.username || u.user?.username) !== targetUsername));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (targetUsername, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow/reject`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ params: { username: targetUsername } })
      });
      if (response.ok) {
        setUsers(prev => prev.filter(u => (u.username || u.user?.username) !== targetUsername));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserClick = (targetUsername) => {
    if (!targetUsername) return;
    onClose();

    const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    const myUsername = myUserObj?.username || "";

    if (targetUsername.toLowerCase() === myUsername.toLowerCase()) {
      if (setCurrentView) setCurrentView("my-profile");
      navigate("/my-profile");
    } else {
      localStorage.setItem("selected_username", targetUsername);
      if (setCurrentView) setCurrentView("profile");
      navigate(`/profile/${targetUsername}`, { state: { username: targetUsername } });
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameStr = (u.full_name || u.user?.full_name || u.username || u.user?.username || "");
    const usernameStr = (u.username || u.user?.username || "");
    return nameStr.toLowerCase().includes(search.toLowerCase()) || 
           usernameStr.toLowerCase().includes(search.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden transition-colors duration-300 border border-[#eee2df] dark:border-zinc-800 flex flex-col max-h-[85vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#eee2df] dark:border-zinc-800 px-6 py-5 transition-colors duration-300">
          <h2 className="text-xl font-bold text-[#2d1c1c] dark:text-zinc-100 transition-colors duration-300 capitalize">
            {activeTab}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#fbf3f1] dark:hover:bg-zinc-800 transition text-[#7a5b5b] dark:text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#eee2df] dark:border-zinc-800 transition-colors duration-300">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors duration-300 ${
              activeTab === "followers"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-[#7a5b5b] dark:text-zinc-400"
            }`}
          >
            Followers
          </button>

          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors duration-300 ${
              activeTab === "following"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-[#7a5b5b] dark:text-zinc-400"
            }`}
          >
            Following
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors duration-300 ${
              activeTab === "requests"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-[#7a5b5b] dark:text-zinc-400"
            }`}
          >
            Requests
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-4 border-b border-[#eee2df] dark:border-zinc-800 transition-colors duration-300">
          <div className="flex items-center gap-3 rounded-2xl bg-[#fbf3f1] dark:bg-zinc-800/50 px-4 py-3 transition-colors duration-300">
            <Search size={18} className="text-[#7a5b5b] dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-[#2d1c1c] dark:text-zinc-200 placeholder-[#b8a1a1] dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* USERS LIST */}
        <div className="flex-1 overflow-y-auto min-h-[300px] p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-[#7a5b5b] dark:text-zinc-500 font-medium">
              No {activeTab} found.
            </div>
          ) : (
            filteredUsers.map((item, idx) => {
              const itemUsername = item.username || item.user?.username || "";
              const itemFullName = item.full_name || item.user?.full_name || itemUsername;
              const itemAvatar = item.avatar_url || item.avatar || item.user?.avatar_url || item.user?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
              const isCurrentUser = (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).username : "") === itemUsername;

              const isFollowedByMe = followingStates[itemUsername] || false;

              return (
                <div
                  key={idx}
                  onClick={() => handleUserClick(itemUsername)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#fbf3f1] dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {(() => {
                      const stories = activeStoryUsers[itemUsername];
                      const hasStories = stories && stories.length > 0;
                      const hasUnviewed = hasStories && stories.some(s => s.is_viewed === false);
                      
                      return (
                        <div 
                          onClick={(e) => {
                            if (hasStories) {
                              e.stopPropagation(); // prevent navigation
                              setSelectedUserStories(stories);
                              setSelectedUsername(itemUsername);
                              setSelectedUserFullName(itemFullName);
                              setSelectedUserAvatar(itemAvatar);
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
                              : "border border-[#eadcdc] dark:border-zinc-800"
                          }`}
                        >
                          <img
                            src={itemAvatar}
                            alt={itemUsername}
                            className={`h-11 w-11 rounded-full object-cover ${hasStories ? "border-2 border-white dark:border-zinc-900" : ""}`}
                          />
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#2d1c1c] dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                        {itemUsername}
                      </h3>
                      <p className="text-xs text-[#7a5b5b] dark:text-zinc-400 truncate">
                        {itemFullName}
                      </p>
                    </div>
                  </div>

                  {!isCurrentUser && (
                    activeTab === "requests" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleAcceptRequest(itemUsername, e)}
                          className="px-4 py-2 rounded-xl bg-[#2dd4bf] text-white text-xs font-bold hover:bg-[#14b8a6] transition duration-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => handleRejectRequest(itemUsername, e)}
                          className="px-4 py-2 rounded-xl bg-[#efefef] dark:bg-zinc-800 text-[#2d1b1b] dark:text-zinc-250 text-xs font-bold hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition duration-200"
                        >
                          Reject
                        </button>
                      </div>
                    ) : isFollowedByMe ? (
                      <button 
                        onClick={(e) => toggleFollow(itemUsername, e)}
                        className="px-4 py-2 rounded-xl bg-[#efefef] dark:bg-zinc-800 text-[#2d1b1b] dark:text-zinc-250 text-xs font-bold hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition duration-200 shrink-0"
                      >
                        Following
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => toggleFollow(itemUsername, e)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-400 px-4 py-2 text-xs font-bold text-white shadow hover:scale-105 transition duration-200 shrink-0"
                      >
                        <UserPlus size={14} />
                        Follow
                      </button>
                    )
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

export default FollowModal;