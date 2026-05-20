import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Compass,
  Clapperboard,
  MessageCircle,
  Settings,
  LogOut,
  User,
  Shield,
  FileText,
  HelpCircle,
  Grid3X3,
  Bookmark,
  Plus,
  Send,
  Sun,
  Moon,
  Lock,
  MoreHorizontal,
  Search,
  Heart,
  X,
} from "lucide-react";

import FollowModal from "./FollowModal";
import PostModal from "./PostModal";
import StoryViewerModal from "./StoryViewerModal";

const profileImage =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

const USER_AVATARS = {
  sonya_leena: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  adam_addisin: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  andrew_dewitt: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  julia_designs: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  alex_coder: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  nature_pics: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
  nicole_bell: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
  ashley_wood: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
  john_doe: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
};

const highlights = [
  {
    title: "BTS",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Frisbee",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop",
  },
];

const mockPosts = [
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
];

function Profile({ setCurrentView }) {
  const navigate = useNavigate();
  const location = useLocation();

  const username = location.state?.username || localStorage.getItem("selected_username") || "john_doe1";

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && document.documentElement.classList.contains("dark"));
  });
  
  const [followStatus, setFollowStatus] = useState('none'); // 'none' | 'following' | 'requested'
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [tabType, setTabType] = useState("followers");

  const [isBlocked, setIsBlocked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [postsData, setPostsData] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isAvatarEnlarged, setIsAvatarEnlarged] = useState(false);

  // Stories States
  const [userStories, setUserStories] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setPostsData([]);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const encodedUsername = encodeURIComponent(username);
        let followingActive = false;
        let blockedActive = false;
        let profileInfo = null;

        // 1. Fetch other user profile
        const profileRes = await fetch(`https://tiem.digitaligrow.com/api/v1/profile/${encodedUsername}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const profileJson = await profileRes.json();
        if (profileRes.ok && profileJson.success) {
          profileInfo = profileJson.data;
          setProfileData(profileInfo);
        }

        // 2. Fetch other user stats
        const statsRes = await fetch(`https://tiem.digitaligrow.com/api/v1/profile/${encodedUsername}/stats`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const statsJson = await statsRes.json();
        if (statsRes.ok && statsJson.success) {
          setProfileStats(statsJson.data);
        }

        // 3. Check follow status using dedicated API
        try {
          const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
          const myUsername = myUserObj?.username || "";
          
          if (myUsername && username !== myUsername) {
            const statusRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodedUsername}/follow-status`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            const statusJson = await statusRes.json();
            if (statusRes.ok && statusJson.success && statusJson.data) {
              if (statusJson.data.following) {
                followingActive = true;
                setFollowStatus('following');
              } else if (statusJson.data.requested || statusJson.data.status === 'pending') {
                setFollowStatus('requested');
              } else {
                setFollowStatus('none');
              }
            }
          }
        } catch (statusErr) {
          console.error("Error checking follow status:", statusErr);
        }

        // 4. Fetch blocked users list to check if we blocked this user
        try {
          const blockedRes = await fetch("https://tiem.digitaligrow.com/api/v1/users/me/blocked", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          const blockedJson = await blockedRes.json();
          if (blockedRes.ok && blockedJson.success && Array.isArray(blockedJson.data)) {
            blockedActive = blockedJson.data.some(u => 
              (u.username || u.user?.username || "").toLowerCase() === username.toLowerCase()
            );
            setIsBlocked(blockedActive);
          }
        } catch (blockedErr) {
          console.error("Error checking blocked status:", blockedErr);
        }

        // 5. Fetch posts if authorized
        const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
        const isSelf = myUserObj && myUserObj.username.toLowerCase() === username.toLowerCase();
        const canViewContent = !blockedActive && (!profileInfo?.is_private || followingActive || isSelf);

        if (canViewContent) {
          try {
            const postsRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodedUsername}/posts?page=1&limit=50&sort=time`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            const postsJson = await postsRes.json();
            if (postsRes.ok && postsJson.success) {
              setPostsData(postsJson.data || []);
            }
          } catch (postsErr) {
            console.error("Error fetching user posts:", postsErr);
          }
        }

        // 6. Fetch active stories for the visited user
        try {
          const storiesRes = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/user/${encodedUsername}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const storiesJson = await storiesRes.json();
          if (storiesRes.ok && storiesJson.success && Array.isArray(storiesJson.data)) {
            setUserStories(storiesJson.data);
          }
        } catch (storiesErr) {
          console.error("Error fetching user stories on profile mount:", storiesErr);
        }
      } catch (err) {
        console.error("Error loading user profile details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const prevStatus = followStatus;
    
    // Optimistic update
    if (followStatus === 'following' || followStatus === 'requested') {
      setFollowStatus('none');
    } else {
      // If private, show requested; if public, show following
      setFollowStatus(profileData?.is_private ? 'requested' : 'following');
    }

    try {
      const method = (prevStatus === 'following' || prevStatus === 'requested') ? "DELETE" : "POST";
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodeURIComponent(username)}/follow`, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        setFollowStatus(prevStatus);
        return;
      }

      // Re-check actual follow status from API
      try {
        const statusRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodeURIComponent(username)}/follow-status`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const statusJson = await statusRes.json();
        if (statusRes.ok && statusJson.success && statusJson.data) {
          if (statusJson.data.following) {
            setFollowStatus('following');
          } else if (statusJson.data.requested || statusJson.data.status === 'pending') {
            setFollowStatus('requested');
          } else {
            setFollowStatus('none');
          }
        }
      } catch (e) {
        console.error("Error re-checking follow status:", e);
      }

      // Refresh stats
      try {
        const statsRes = await fetch(`https://tiem.digitaligrow.com/api/v1/profile/${encodeURIComponent(username)}/stats`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const statsJson = await statsRes.json();
        if (statsRes.ok && statsJson.success) {
          setProfileStats(statsJson.data);
        }
      } catch (e) {
        console.error(e);
      }

      // If now following, fetch posts (for newly followed public/accepted private profiles)
      if (method === 'POST') {
        const statusRes2 = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodeURIComponent(username)}/follow-status`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const statusJson2 = await statusRes2.json();
        if (statusJson2?.data?.following) {
          try {
            const postsRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodeURIComponent(username)}/posts?page=1&limit=50&sort=time`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            const postsJson = await postsRes.json();
            if (postsRes.ok && postsJson.success) {
              setPostsData(postsJson.data || []);
            }
          } catch (postsErr) {
            console.error("Error fetching user posts:", postsErr);
          }
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setFollowStatus(prevStatus);
    }
  };

  const handleBlockToggle = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const originalBlockedState = isBlocked;
    setIsBlocked(!originalBlockedState);

    try {
      const method = originalBlockedState ? "DELETE" : "POST";
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${encodeURIComponent(username)}/block`, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: {
            username: username
          }
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        setIsBlocked(originalBlockedState);
      }
    } catch (err) {
      console.error("Error toggling block:", err);
      setIsBlocked(originalBlockedState);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(profileUrl);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token") || "";
    
    // Clear localStorage immediately
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("selected_username");
    
    // Navigation redirect
    if (setCurrentView) setCurrentView("login");
    navigate("/login");

    try {
      if (refreshToken) {
        await fetch("https://tiem.digitaligrow.com/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch (err) {
      console.error("Error calling auth/logout API:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f7] dark:bg-zinc-950 flex transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-[290px] bg-white dark:bg-zinc-950 border-r border-[#eee] dark:border-zinc-800 px-6 py-10 flex flex-col justify-between fixed h-screen transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 mb-12 px-2 cursor-pointer hover:opacity-80 transition" onClick={() => { if (setCurrentView) setCurrentView("home"); navigate("/home"); }}>
            <img
              src="/logo.png"
              alt="logo"
              className="w-9 h-9 object-cover rounded-lg shadow-sm border border-[#eee] dark:border-zinc-800"
            />
            <h1
              className="text-[34px] font-extrabold tracking-tight"
              style={{ lineHeight: "1.2" }}
            >
              <span className="text-[#d6333b]">TIEM</span>
              <span className="bg-gradient-to-r from-[#ef553e] to-[#f79b42] bg-clip-text text-transparent">
                gram
              </span>
            </h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={<HomeIcon size={22} />} text="Feed" onClick={() => { if (setCurrentView) setCurrentView("home"); navigate("/home", { state: { activeTab: "Feed" } }); }} />
            <SidebarItem icon={<Search size={22} />} text="Search" onClick={() => { if (setCurrentView) setCurrentView("home"); navigate("/home", { state: { activeTab: "Search" } }); }} />
            <SidebarItem icon={<Compass size={22} />} text="Explore" />
            <SidebarItem icon={<Clapperboard size={22} />} text="Reels" />
            <SidebarItem icon={<MessageCircle size={22} />} text="Messages" />
            <SidebarItem icon={<User size={22} />} text="Profile" active onClick={() => { if (setCurrentView) setCurrentView("my-profile"); navigate("/my-profile"); }} />
          </nav>
        </div>

        <div>
          <div className="space-y-3">
            <SidebarItem icon={<Settings size={20} />} text="Settings" />
            <SidebarItem icon={<LogOut size={20} />} text="Logout" onClick={handleLogout} />
          </div>

          <button className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-400 text-white font-semibold shadow-xl hover:scale-[1.02] transition duration-300">
            New Highlight
          </button>

          <div className="flex items-center justify-center gap-5 mt-10 text-[#7a5b5b]">
            <Shield size={18} />
            <FileText size={18} />
            <HelpCircle size={18} />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-[290px] flex-1 px-10 py-10 relative">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="absolute top-10 right-10 w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <svg className="animate-spin h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto mt-4 animate-fadeIn">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16">
              
              {/* PROFILE IMAGE */}
              <div className="flex justify-center shrink-0">
                {(() => {
                  const hasStories = userStories.length > 0;
                  const hasUnviewed = userStories.some(s => s.is_viewed === false);
                  
                  return (
                    <div 
                      onClick={() => {
                        if (hasStories) {
                          const firstUnviewed = userStories.findIndex(s => s.is_viewed === false);
                          setActiveStoryIdx(firstUnviewed !== -1 ? firstUnviewed : 0);
                          setShowStoryViewer(true);
                        } else {
                          setIsAvatarEnlarged(true);
                        }
                      }}
                      className={`p-[5px] rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg ${
                        hasStories
                          ? hasUnviewed
                            ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    >
                      <div className="w-[180px] h-[180px] rounded-full overflow-hidden border-[5px] border-white dark:border-zinc-950">
                        <img
                          src={profileData?.avatar_url || profileData?.avatar || USER_AVATARS[username] || profileImage}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* PROFILE INFO */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <h2 className="text-4xl font-bold text-[#2d1c1c] dark:text-zinc-100 transition-colors">
                      {profileData?.full_name || "User Profile"}
                    </h2>
                    <p className="text-[#7a5b5b] dark:text-zinc-500 mt-1.5 transition-colors">
                      @{profileData?.username || username}
                    </p>
                  </div>

                  {followStatus === 'following' ? (
                    <button 
                      onClick={handleFollowToggle}
                      className="px-6 py-3 bg-[#efefef] dark:bg-zinc-800 rounded-xl font-semibold text-[#2d1b1b] dark:text-zinc-200 hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition"
                    >
                      Following
                    </button>
                  ) : followStatus === 'requested' ? (
                    <button 
                      onClick={handleFollowToggle}
                      className="px-6 py-3 bg-[#fff3cd] dark:bg-yellow-900/30 border border-yellow-400/40 rounded-xl font-semibold text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition"
                    >
                      Requested
                    </button>
                  ) : (
                    <button 
                      onClick={handleFollowToggle}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-400 rounded-xl font-semibold text-white hover:scale-105 shadow-md transition"
                    >
                      Follow
                    </button>
                  )}

                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-12 h-12 rounded-xl bg-[#efefef] dark:bg-zinc-800 hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 text-[#2d1b1b] dark:text-zinc-200 flex items-center justify-center transition"
                    >
                      <MoreHorizontal size={22} />
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-[#eee2df] dark:border-zinc-800 py-2 z-50 animate-[fadeIn_.2s_ease]">
                        <button 
                          onClick={() => {
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fbf3f1] dark:hover:bg-zinc-800 text-[#2d1c1c] dark:text-zinc-200 font-semibold text-sm transition text-left"
                        >
                          <MessageCircle size={18} className="text-[#7a5b5b] dark:text-zinc-400" />
                          Message
                        </button>

                        <button 
                          onClick={() => {
                            setShowDropdown(false);
                            handleShareProfile();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fbf3f1] dark:hover:bg-zinc-800 text-[#2d1c1c] dark:text-zinc-200 font-semibold text-sm transition text-left"
                        >
                          <Send size={18} className="text-[#7a5b5b] dark:text-zinc-400" />
                          Share Profile
                        </button>

                        <div className="h-px bg-zinc-150 dark:bg-zinc-800 my-1"></div>

                        <button 
                          onClick={() => {
                            setShowDropdown(false);
                            handleBlockToggle();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold text-sm transition text-left"
                        >
                          <Shield size={18} />
                          {isBlocked ? "Unblock Account" : "Block Account"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATS */}
                <div className="flex gap-10 mt-8 text-lg text-[#2d1b1b] dark:text-zinc-400 transition-colors">
                  <p>
                    <span className="font-bold text-[#2d1c1c] dark:text-zinc-100">
                      {profileStats?.posts_count ?? profileStats?.posts ?? postsData.length}
                    </span> posts
                  </p>

                  <p 
                    onClick={() => {
                      if (profileData?.is_private && followStatus !== 'following') return;
                      setTabType("followers");
                      setShowModal(true);
                    }}
                    className={`${(profileData?.is_private && followStatus !== 'following') ? "" : "cursor-pointer hover:text-red-500"} transition duration-200`}
                  >
                    <span className="font-bold text-[#2d1c1c] dark:text-zinc-100">
                      {profileStats?.followers_count ?? profileStats?.followers ?? "0"}
                    </span> followers
                  </p>

                  <p 
                    onClick={() => {
                      if (profileData?.is_private && followStatus !== 'following') return;
                      setTabType("following");
                      setShowModal(true);
                    }}
                    className={`${(profileData?.is_private && followStatus !== 'following') ? "" : "cursor-pointer hover:text-red-500"} transition duration-200`}
                  >
                    <span className="font-bold text-[#2d1c1c] dark:text-zinc-100">
                      {profileStats?.following_count ?? profileStats?.following ?? "0"}
                    </span> following
                  </p>
                </div>

                {/* BIO */}
                <div className="mt-8">
                  <p className="text-[#4f3c3c] dark:text-zinc-300 text-lg transition-colors whitespace-pre-line">
                    {profileData?.bio || `Building cool things on TIEMgram 🚀`}
                  </p>

                  {(profileData?.department || profileData?.year || profileData?.semester) && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#8b6666] dark:text-zinc-300 bg-[#fbf3f1] dark:bg-zinc-900/60 px-5 py-3 rounded-2xl border border-[#eee2df] dark:border-zinc-800/80 w-fit backdrop-blur-sm shadow-sm transition-colors duration-300">
                      {profileData.department && <span className="flex items-center gap-1.5">🎓 {profileData.department}</span>}
                      {profileData.year && <span className="flex items-center gap-1.5">📅 Year {profileData.year}</span>}
                      {profileData.semester && <span className="flex items-center gap-1.5">📖 Semester {profileData.semester}</span>}
                    </div>
                  )}

                  {profileData?.website && (
                    <a
                      href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0f766e] dark:text-teal-400 font-semibold mt-3 block transition-colors"
                    >
                      {profileData.website}
                    </a>
                  )}


                </div>

                {/* ACTIVE STORIES / HIGHLIGHTS */}
                {userStories.length > 0 && (
                  <div className="flex items-center gap-8 mt-14 overflow-x-auto pb-4 scrollbar-hide">
                    {userStories.map((story, index) => {
                      const isText = story.type === "text";
                      const timeAgo = (() => {
                        const diffMs = new Date() - new Date(story.createdAt);
                        const diffMins = Math.floor(diffMs / 60000);
                        if (diffMins < 60) return `${diffMins}m ago`;
                        const diffHrs = Math.floor(diffMins / 60);
                        return `${diffHrs}h ago`;
                      })();

                      return (
                        <div
                          key={story.id}
                          onClick={() => {
                            setActiveStoryIdx(index);
                            setShowStoryViewer(true);
                          }}
                          className="text-center flex flex-col items-center cursor-pointer group shrink-0 animate-[fadeIn_.3s_ease]"
                        >
                          <div className="w-24 h-24 rounded-full p-[3px] bg-zinc-200 dark:bg-zinc-800 group-hover:scale-105 transition-transform shadow-sm">
                            {isText ? (
                              <div
                                className="w-full h-full rounded-full flex items-center justify-center p-2 text-center text-white text-[9px] font-bold overflow-hidden border-2 border-white dark:border-zinc-950"
                                style={{ backgroundColor: story.background_color || "#E91E8C" }}
                              >
                                <span className="line-clamp-3">{story.text_content}</span>
                              </div>
                            ) : (
                              <img
                                src={story.mediaUrl}
                                alt="story"
                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-950"
                              />
                            )}
                          </div>
                          <p className="mt-3 font-semibold text-sm group-hover:text-red-500 transition-colors">
                            {timeAgo}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {isBlocked ? (
              /* BLOCKED SCREEN COVER */
              <div className="flex flex-col items-center justify-center border-t border-[#eadcdc] dark:border-zinc-800 mt-16 py-20 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center mb-6 bg-red-500/10 text-red-500">
                  <Shield size={28} />
                </div>
                <h3 className="text-2xl font-bold text-[#2d1c1c] dark:text-white mb-2">Account Blocked</h3>
                <p className="text-base text-[#7a5b5b] dark:text-zinc-500 max-w-sm mb-6">
                  You have blocked this account. Unblock them to view their photos and videos.
                </p>
                <button 
                  onClick={handleBlockToggle}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-400 rounded-xl font-semibold text-white hover:scale-105 shadow-md transition"
                >
                  Unblock User
                </button>
              </div>
            ) : (profileData?.is_private && followStatus !== 'following') ? (
              /* PRIVATE ACCOUNT LOCK SCREEN */
              <div className="flex flex-col items-center justify-center border-t border-[#eadcdc] dark:border-zinc-800 mt-16 py-20 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full border-2 border-[#2d1c1c] dark:border-zinc-400 flex items-center justify-center mb-6">
                  <Lock className="w-7 h-7 text-[#2d1c1c] dark:text-zinc-400" />
                </div>
                <h3 className="text-2xl font-bold text-[#2d1c1c] dark:text-white mb-2">This Account is Private</h3>
                <p className="text-base text-[#7a5b5b] dark:text-zinc-500 max-w-sm">
                  Follow this account to see their photos and videos.
                </p>
              </div>
            ) : (
              <>
                {/* TABS */}
                <div className="border-t border-[#eadcdc] dark:border-zinc-800 mt-20 pt-6">
                  <div className="flex items-center justify-center gap-16 text-[#7a5b5b] font-semibold">
                    <button className="flex items-center gap-2 text-black dark:text-white border-t-2 border-black dark:border-white pt-4">
                      <Grid3X3 size={18} />
                      POSTS
                    </button>

                    <button className="flex items-center gap-2 hover:text-black dark:hover:text-white transition">
                      <Clapperboard size={18} />
                      REELS
                    </button>

                    <button className="flex items-center gap-2 hover:text-black dark:hover:text-white transition">
                      <Bookmark size={18} />
                      TAGGED
                    </button>
                  </div>
                </div>

                {/* POSTS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
                  {postsData.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-[#7a5b5b] dark:text-zinc-500 font-medium">
                      No posts yet.
                    </div>
                  ) : (
                    postsData.map((post) => {
                      const postImage = post.PostMedia?.[0]?.url || post.image || "";
                      const isTextPost = post.type === "text" || post.isTextPost;

                      return (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPost({
                            ...post,
                            username: username,
                            full_name: profileData?.full_name || "User",
                            avatar: profileData?.avatar_url || profileData?.avatar || "",
                            image: postImage,
                            likes: post.likes_count || 0,
                            comments: "0"
                          })}
                          className="relative overflow-hidden rounded-2xl group cursor-pointer bg-white dark:bg-[#1b1b1b] shadow-sm hover:shadow-2xl transition duration-300 animate-[fadeIn_.3s_ease]"
                        >
                          {isTextPost ? (
                            <div className={`w-full h-[420px] flex items-center justify-center p-8 text-center text-white font-bold text-2xl ${post.textBg || "bg-gradient-to-r from-purple-500 to-indigo-500"}`}>
                              <p className="line-clamp-6">{post.caption || "Text Post"}</p>
                            </div>
                          ) : (
                            <img
                              src={postImage}
                              alt=""
                              className="w-full h-[420px] object-cover group-hover:scale-110 transition duration-500"
                            />
                          )}

                          <div className="absolute inset-0 bg-black/30 transition duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex items-center gap-8 text-white font-bold text-xl">
                              <div className="flex items-center gap-2">
                                ❤️ {post.likes_count || 0}
                              </div>

                              <div className="flex items-center gap-2">
                                💬 0
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <FollowModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        defaultTab={tabType} 
        username={username}
        setCurrentView={setCurrentView}
      />

      <PostModal 
        post={selectedPost} 
        onClose={() => setSelectedPost(null)} 
        onUpdatePost={(updatedPost) => {
          setSelectedPost(updatedPost);
          setPostsData(prev => prev.map(p => p.id === updatedPost.id ? { ...p, likes_count: updatedPost.likes, isLiked: updatedPost.isLiked } : p));
        }}
      />

      {/* Enlarged Avatar Modal */}
      {isAvatarEnlarged && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300"
          onClick={() => setIsAvatarEnlarged(false)}
        >
          <button 
            onClick={() => setIsAvatarEnlarged(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition bg-white/10 p-3 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <div 
            className="relative max-w-[90vw] max-h-[90vh] w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] rounded-full overflow-hidden p-1.5 bg-gradient-to-r from-red-600 to-orange-400 animate-[zoomIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profileData?.avatar_url || profileData?.avatar || USER_AVATARS[username] || profileImage}
              alt="Enlarged Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-950 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#2d1c1c] text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-[fadeIn_.3s_ease] font-semibold text-sm">
          <span>🔗</span>
          Profile link copied to clipboard!
        </div>
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && userStories.length > 0 && (
        <StoryViewerModal
          userStories={[{
            username: profileData?.username || username || "user",
            full_name: profileData?.full_name || "User",
            avatar: profileData?.avatar_url || profileData?.avatar || USER_AVATARS[username] || profileImage,
            stories: userStories
          }]}
          initialUserIndex={0}
          initialStoryIndex={activeStoryIdx}
          onClose={() => setShowStoryViewer(false)}
          onStoryViewed={(storyId) => {
            setUserStories(prev => prev.map(s => s.id === storyId ? { ...s, is_viewed: true } : s));
          }}
        />
      )}
    </div>
  );
}

function SidebarItem({ icon, text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition duration-300 ${
        active
          ? "bg-[#fff1ea] dark:bg-red-500/10 text-red-600 dark:text-red-500 shadow-sm"
          : "text-[#4f3c3c] dark:text-zinc-400 hover:bg-[#f7f2f2] dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
      }`}
    >
      <div className={active ? "text-red-600 dark:text-red-500" : "text-[#7a5b5b] dark:text-zinc-500"}>
        {icon}
      </div>
      <span className="text-lg">{text}</span>
    </button>
  );
}

export default Profile;