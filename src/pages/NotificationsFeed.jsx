import React, { useState, useEffect } from "react";
import { getAvatarUrl } from "../utils/avatar";

const notifications = [
  {
    title: "Today",
    items: [
      {
        id: 1,
        user: "sarah_smith",
        action: "started following you.",
        time: "2h",
        type: "follow",
        isFollowing: false,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
      },
      {
        id: 2,
        user: "alex_dev",
        action: "liked your photo.",
        time: "4h",
        type: "like",
        postImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=150&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "This Week",
    items: [
      {
        id: 3,
        user: "julia_designs",
        action: "mentioned you in a comment: @abhi_navkhare love this!",
        time: "2d",
        type: "comment",
        postImage: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=150&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop"
      },
      {
        id: 4,
        user: "creative_mind",
        action: "started following you.",
        time: "4d",
        type: "follow",
        isFollowing: true,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Earlier",
    items: [
      {
        id: 5,
        user: "john_doe",
        action: "liked your photo.",
        time: "1w",
        type: "like",
        postImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=150&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=150&auto=format&fit=crop"
      }
    ]
  }
];

function NotificationsFeed() {
  const [followStates, setFollowStates] = useState(() => {
    const initial = {};
    notifications.forEach(section =>
      section.items.forEach(item => {
        if (item.type === "follow") initial[item.id] = item.isFollowing;
      })
    );
    return initial;
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      setLoadingRequests(true);
      try {
        const response = await fetch("https://tiem.digitaligrow.com/api/v1/users/me/follow-requests", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const json = await response.json();
        if (response.ok && json.success) {
          setPendingRequests(json.data || []);
        }
      } catch (err) {
        console.error("Error fetching follow requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

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
        setPendingRequests(prev => prev.filter(u => (u.username || u.user?.username) !== targetUsername));
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
        setPendingRequests(prev => prev.filter(u => (u.username || u.user?.username) !== targetUsername));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    setFollowStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 w-full animate-[fadeIn_.3s_ease]">
      <h2 className="text-2xl font-bold mb-6 text-[#2d1b1b] dark:text-white transition-colors duration-300">Notifications</h2>
      
      <div className="space-y-8">
        {loadingRequests ? (
          <div className="py-4 text-center text-[#7a5b5b] dark:text-zinc-500 text-sm">Loading requests...</div>
        ) : pendingRequests.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg text-[#2d1b1b] dark:text-white mb-4 border-b border-[#eee2df] dark:border-zinc-800 pb-2 transition-colors duration-300">
              Follow Requests
            </h3>
            <div className="space-y-5">
              {pendingRequests.map((item, idx) => {
                const itemUsername = item.username || item.user?.username || "";
                const itemAvatar = getAvatarUrl(item.avatar_url || item.avatar || item.user?.avatar_url || item.user?.avatar);
                return (
                  <div key={`req-${idx}`} className="flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 p-2 -mx-2 rounded-xl transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4 flex-1 pr-4">
                      <img 
                        src={itemAvatar} 
                        alt={itemUsername} 
                        className="w-12 h-12 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800"
                      />
                      <div className="text-[15px] leading-tight">
                        <span className="font-bold text-[#2d1b1b] dark:text-white transition-colors duration-300">{itemUsername}</span>{" "}
                        <span className="text-[#5b4343] dark:text-zinc-300 transition-colors duration-300">requested to follow you.</span>{" "}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={(e) => handleAcceptRequest(itemUsername, e)}
                        className="px-4 py-1.5 rounded-lg bg-[#2dd4bf] text-white text-xs font-bold hover:bg-[#14b8a6] transition duration-200"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => handleRejectRequest(itemUsername, e)}
                        className="px-4 py-1.5 rounded-lg bg-[#efefef] dark:bg-zinc-800 text-[#2d1b1b] dark:text-zinc-250 text-xs font-bold hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition duration-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notifications.map((section, idx) => (
          <div key={idx}>
            <h3 className="font-semibold text-lg text-[#2d1b1b] dark:text-white mb-4 border-b border-[#eee2df] dark:border-zinc-800 pb-2 transition-colors duration-300">
              {section.title}
            </h3>
            <div className="space-y-5">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 p-2 -mx-2 rounded-xl transition-all duration-300 cursor-pointer">
                  
                  {/* LEFT: AVATAR & TEXT */}
                  <div className="flex items-center gap-4 flex-1 pr-4">
                    <img 
                      src={item.avatar} 
                      alt={item.user} 
                      className="w-12 h-12 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800"
                    />
                    <div className="text-[15px] leading-tight">
                      <span className="font-bold text-[#2d1b1b] dark:text-white transition-colors duration-300">{item.user}</span>{" "}
                      <span className="text-[#5b4343] dark:text-zinc-300 transition-colors duration-300">{item.action}</span>{" "}
                      <span className="text-zinc-500 dark:text-zinc-500 text-sm transition-colors duration-300">{item.time}</span>
                    </div>
                  </div>

                  {/* RIGHT: ACTION / THUMBNAIL */}
                  <div className="shrink-0">
                    {item.type === "follow" ? (
                      <button
                        onClick={(e) => toggleFollow(item.id, e)}
                        className={`px-5 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 active:scale-95 ${
                          followStates[item.id]
                            ? "bg-[#efefef] dark:bg-zinc-800 text-[#2d1b1b] dark:text-white hover:bg-[#e2e2e2] dark:hover:bg-zinc-700"
                            : "bg-gradient-to-r from-red-600 to-orange-400 text-white hover:scale-105 shadow-md"
                        }`}
                      >
                        {followStates[item.id] ? "Following" : "Follow"}
                      </button>
                    ) : (
                      <img 
                        src={item.postImage} 
                        alt="Post" 
                        className="w-12 h-12 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                      />
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationsFeed;
