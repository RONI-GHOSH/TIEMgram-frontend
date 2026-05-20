import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FollowModal from "./FollowModal";
import PostModal from "./PostModal";
import CreatePostModal from "./CreatePostModal";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";

import {
  Grid3X3,
  Bookmark,
  Tag,
  Settings,
  Plus,
  Archive,
  BarChart3,
  LayoutDashboard,
  Camera,
  Heart,
  MessageCircle,
  Send,
  Compass,
  Moon,
  Sun,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

function MyProfile({ setCurrentView }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("posts");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tabType, setTabType] = useState("followers");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isAvatarEnlarged, setIsAvatarEnlarged] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && document.documentElement.classList.contains("dark"));
  });

  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileStats, setProfileStats] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Stories States
  const [ownStories, setOwnStories] = useState([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [showStoryViewerModal, setShowStoryViewerModal] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const fetchOwnStories = async (username) => {
    const token = localStorage.getItem("access_token");
    if (!token || !username) return;
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/user/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        setOwnStories(resJson.data);
      }
    } catch (err) {
      console.error("Error fetching own stories:", err);
    }
  };



  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileData?.username || "me"}`;
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
    const userData = localStorage.getItem("user");
    let parsedUser = null;
    if (userData) {
      try {
        parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error(err);
      }
    }

    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setProfileError("No access token found.");
        setIsLoadingProfile(false);
        return;
      }

      let fetchedUsername = parsedUser?.username;

      try {
        const response = await fetch("https://tiem.digitaligrow.com/api/v1/profile/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setProfileData(data.data);
          if (data.data.username) {
            fetchedUsername = data.data.username;
          }
        } else {
          setProfileError(data.message || "Failed to load profile.");
        }
      } catch (err) {
        console.error(err);
        setProfileError("Error connecting to backend server.");
      } finally {
        setIsLoadingProfile(false);
      }

      // Fetch stats for this username dynamically (with robust fallback)
      if (fetchedUsername) {
        fetchOwnStories(fetchedUsername);
        try {
          const statsResponse = await fetch(`https://tiem.digitaligrow.com/api/v1/profile/${fetchedUsername}/stats`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const statsData = await statsResponse.json();
          if (statsResponse.ok && statsData.success) {
            setProfileStats(statsData.data);
          }
        } catch (statsErr) {
          console.error("Error fetching stats:", statsErr);
        }

        try {
          const postsResponse = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${fetchedUsername}/posts?page=1&limit=50&sort=time`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const postsRes = await postsResponse.json();
          if (postsResponse.ok && postsRes.success) {
            const backendPosts = postsRes.data.map(p => ({
              id: p.id,
              username: fetchedUsername,
              full_name: parsedUser?.full_name || "Me",
              avatar: parsedUser?.avatar_url || "",
              image: p.PostMedia?.[0]?.url || "",
              likes: p.likes_count || 0,
              comments: "0",
              caption: p.caption,
              type: p.type,
              isTextPost: p.type === "text",
              location: p.location,
              tags: p.tags || [],
              is_public: p.is_public
            }));
            if (typeof setPostsData !== 'undefined') {
              setPostsData(backendPosts);
            }
          }
        } catch (postsErr) {
          console.error("Error fetching posts:", postsErr);
        }
      }
    };

    fetchProfile();
  }, []);

  const profileImage =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

  const highlight1 =
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop";

  const highlight2 =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop";

  const initialPosts = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
      likes: "2.3k",
      comments: "182",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
      likes: "5.1k",
      comments: "420",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
      likes: "3.8k",
      comments: "210",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
      likes: "1.8k",
      comments: "95",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
      likes: "4.4k",
      comments: "300",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
      likes: "6.2k",
      comments: "520",
    },
  ];

  const savedPosts = [
    {
      id: 101,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
      likes: "12.4k",
      comments: "840",
    },
    {
      id: 102,
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop",
      likes: "8.1k",
      comments: "320",
    },
  ];

  const taggedPosts = [
    {
      id: 201,
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
      likes: "4.5k",
      comments: "150",
    },
  ];

  const [postsData, setPostsData] = useState(initialPosts);

  const handleDeletePost = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        setPostsData(prev => prev.filter(post => post.id !== id));
        if (selectedPost?.id === id) {
          setSelectedPost(null);
        }
        // Decrement posts count in profileStats if possible
        if (typeof setProfileStats !== 'undefined') {
          setProfileStats(prev => prev ? {
            ...prev,
            posts_count: Math.max(0, (prev.posts_count || 0) - 1)
          } : null);
        }
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting post");
    }
  };



  return (
    <div className="min-h-screen bg-[#faf7f7] dark:bg-[#111111] dark:text-white transition duration-300">
      {/* TOPBAR */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-xl border-b border-[#eadcdc] dark:border-[#2c2c2c] transition duration-300">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setCurrentView && setCurrentView("home")}>
            <img src="/logo.png" alt="logo" className="w-9 h-9 object-cover rounded-lg shadow-sm border border-[#eadcdc] dark:border-[#2c2c2c]" />
            <h1 className="text-[34px] font-extrabold tracking-tight" style={{ lineHeight: "1.2" }}>
              <span className="text-[#d6333b]">TIEM</span>
              <span className="bg-gradient-to-r from-[#ef553e] to-[#f79b42] bg-clip-text text-transparent">gram</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDark(!isDark)} className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white flex items-center justify-center shadow-lg hover:scale-105 transition">
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} 
                className="px-5 py-3 rounded-xl bg-[#f3f3f3] dark:bg-[#2c2c2c] hover:bg-[#ececec] dark:hover:bg-[#333333] transition font-semibold"
              >
                Settings
              </button>
              
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#262626] rounded-xl shadow-2xl py-2 z-50 border border-[#eadcdc] dark:border-[#333] animate-[fadeIn_.2s_ease]">
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-[#333] transition text-left">
                    <Settings size={18} />
                    <span className="font-medium">Account Settings</span>
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab("saved");
                      setShowSettingsDropdown(false);
                      window.scrollTo({ top: 800, behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-[#333] transition text-left"
                  >
                    <Bookmark size={18} />
                    <span className="font-medium">Saved</span>
                  </button>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-[#333] transition text-left text-red-500"
                  >
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setShowUploadModal(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-400 text-white font-semibold shadow-lg hover:scale-105 transition">
              Create Post
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* PROFILE SECTION */}
            <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex justify-center">
            {(() => {
              const hasStories = ownStories.length > 0;
              const hasUnviewed = ownStories.some(s => s.is_viewed === false);
              
              return (
                <div 
                  onClick={() => {
                    if (hasStories) {
                      const firstUnviewed = ownStories.findIndex(s => s.is_viewed === false);
                      setActiveStoryIdx(firstUnviewed !== -1 ? firstUnviewed : 0);
                      setShowStoryViewerModal(true);
                    } else {
                      setIsAvatarEnlarged(true);
                    }
                  }}
                  className={`w-[200px] h-[200px] rounded-full p-[5px] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg ${
                    hasStories
                      ? hasUnviewed
                        ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500"
                        : "bg-zinc-300 dark:bg-zinc-700"
                      : "bg-gradient-to-r from-red-600 to-orange-400"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-[5px] border-white dark:border-[#111111]">
                    <img src={profileData?.avatar_url || profileData?.avatar || currentUser?.avatar_url || currentUser?.avatar || profileImage} alt="profile avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <h2 className="text-5xl font-bold text-[#2d1c1c] dark:text-white">{profileData?.full_name || currentUser?.full_name || "John Doe"}</h2>
                <p className="text-[#7a5b5b] dark:text-gray-400 mt-2">@{profileData?.username || currentUser?.username || "john_doe"}</p>
              </div>
              <button onClick={() => setCurrentView && setCurrentView("edit-profile")} className="px-6 py-3 bg-[#efefef] dark:bg-[#2c2c2c] rounded-xl font-semibold hover:bg-[#e2e2e2] dark:hover:bg-[#333333] transition">Edit Profile</button>
              <button onClick={handleShareProfile} className="px-6 py-3 bg-[#efefef] dark:bg-[#2c2c2c] rounded-xl font-semibold hover:bg-[#e2e2e2] dark:hover:bg-[#333333] transition">Share Profile</button>
            </div>
             <div className="flex gap-12 mt-10 text-lg flex-wrap">
              <p>
                <span className="font-bold">{profileStats?.posts_count ?? profileStats?.posts ?? postsData.length}</span> posts
              </p>
              <button onClick={() => { setTabType("followers"); setShowModal(true); }} className="hover:text-red-500 transition">
                <strong>{profileStats?.followers_count ?? profileStats?.followers ?? "1.2k"}</strong> followers
              </button>
              <button onClick={() => { setTabType("following"); setShowModal(true); }} className="hover:text-red-500 transition">
                <strong>{profileStats?.following_count ?? profileStats?.following ?? "320"}</strong> following
              </button>
            </div>
            <div className="mt-10">
              <p className="mt-3 text-[#4f3c3c] dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {profileData?.bio || currentUser?.bio || (profileData || currentUser ? `${profileData?.department || currentUser?.department || ""} Student 🎓\nYear: ${profileData?.year || currentUser?.year || ""}, Semester: ${profileData?.semester || currentUser?.semester || ""}` : `Computer Science Student 💻\nBuilding cool things with React & AI 🚀`)}
              </p>
              {(profileData?.website || currentUser?.website) && (
                <a
                  href={(profileData?.website || currentUser?.website).startsWith('http') ? (profileData?.website || currentUser?.website) : `https://${(profileData?.website || currentUser?.website)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0f766e] dark:text-[#2dd4bf] font-semibold mt-3 block"
                >
                  {profileData?.website || currentUser?.website}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              {(profileData?.is_private || currentUser?.is_private) && (
                <button 
                  onClick={() => { setTabType("requests"); setShowModal(true); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#1b1b1b] border border-[#eadcdc] dark:border-[#2c2c2c] shadow-sm hover:shadow-md transition text-orange-500 font-semibold"
                >
                  <UserPlus size={18} /> Follow Requests
                </button>
              )}
                      <button 
                onClick={() => setShowCreateStoryModal(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#1b1b1b] border border-[#eadcdc] dark:border-[#2c2c2c] shadow-sm hover:shadow-md transition"
              >
                <Plus size={18} /> Add Story
              </button>
            </div>
          </div>
        </div>
 
        {/* ACTIVE STORIES / HIGHLIGHTS */}
        <div className="flex items-center gap-8 mt-16 overflow-x-auto pb-4 scrollbar-hide">
          {/* "+ New" button (Always visible on MyProfile) */}
          <div className="text-center flex flex-col items-center select-none shrink-0 animate-[fadeIn_.3s_ease]">
            <button
              onClick={() => setShowCreateStoryModal(true)}
              className="w-28 h-28 rounded-full border-2 border-dashed border-[#eadcdc] dark:border-[#2c2c2c] flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 bg-white/50 dark:bg-zinc-900/50 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus size={36} />
            </button>
            <p className="mt-3 font-semibold text-sm text-zinc-500 dark:text-zinc-400">New</p>
          </div>

          {/* Active stories list */}
          {ownStories.map((story, index) => {
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
                  setShowStoryViewerModal(true);
                }}
                className="text-center flex flex-col items-center cursor-pointer group shrink-0 animate-[fadeIn_.3s_ease]"
              >
                <div className="w-28 h-28 rounded-full p-[3px] bg-zinc-200 dark:bg-zinc-800 group-hover:scale-105 transition-transform shadow-sm">
                  {isText ? (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center p-2 text-center text-white text-[9px] font-bold overflow-hidden border-2 border-white dark:border-[#111111]"
                      style={{ backgroundColor: story.background_color || "#E91E8C" }}
                    >
                      <span className="line-clamp-3">{story.text_content}</span>
                    </div>
                  ) : (
                    <img 
                      src={story.mediaUrl} 
                      alt="story" 
                      className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#111111]" 
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

        {/* TABS */}
        <div className="border-t border-[#eadcdc] dark:border-[#2c2c2c] mt-16">
          <div className="flex justify-center gap-20">
            {[
              { key: "posts", icon: <Grid3X3 size={18} />, label: "POSTS" },
              { key: "saved", icon: <Bookmark size={18} />, label: "SAVED" },
              { key: "tagged", icon: <Tag size={18} />, label: "TAGGED" },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 py-5 border-t-2 text-sm tracking-[3px] transition ${activeTab === tab.key ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-[#8f6f6f] dark:text-gray-500"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* POSTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {(activeTab === "posts" ? postsData : activeTab === "saved" ? savedPosts : taggedPosts).map((post) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className="relative group rounded-2xl overflow-hidden bg-white dark:bg-[#1b1b1b] shadow-sm hover:shadow-2xl transition duration-300 animate-[fadeIn_.3s_ease] cursor-pointer"
            >
              {post.isTextPost || post.type === "text" ? (
                <div className={`w-full h-[420px] flex items-center justify-center p-8 text-center text-white font-bold text-2xl ${post.textBg || "bg-gradient-to-r from-purple-500 to-indigo-500"}`}>
                  <p className="line-clamp-6">{post.caption || "Text Post"}</p>
                </div>
              ) : (
                <img src={post.image} alt="" className="w-full h-[420px] object-cover group-hover:scale-105 transition duration-500" />
              )}
              
              {/* OVERLAY */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-8 text-white font-bold text-lg">
                <div className="flex items-center gap-2">
                  <Heart size={24} fill="white" /> {post.likes}
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={24} /> {post.comments}
                </div>
                <Send size={24} />
                
                {activeTab === "posts" && (
                  <button 
                    onClick={(e) => handleDeletePost(post.id, e)} 
                    className="absolute top-4 right-4 p-3 bg-red-600/90 rounded-full hover:bg-red-700 hover:scale-110 transition shadow-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING BUTTON */}
      <button onClick={() => setShowUploadModal(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition z-50">
        <Plus size={30} />
      </button>

      {/* PREMIUM UPLOAD MODAL */}
      {showUploadModal && (
        <CreatePostModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newPostItem) => {
            if (typeof setPostsData !== 'undefined') {
              setPostsData(prev => [newPostItem, ...prev]);
            }
            
            // Also increment posts count in profileStats!
            if (typeof setProfileStats !== 'undefined') {
              setProfileStats(prev => prev ? {
                ...prev,
                posts_count: (prev.posts_count || 0) + 1
              } : null);
            }
          }}
        />
      )}

      <FollowModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        defaultTab={tabType} 
        username={profileData?.username || currentUser?.username}
        setCurrentView={setCurrentView}
      />
      
      <PostModal 
        post={selectedPost} 
        onClose={() => setSelectedPost(null)} 
        onUpdatePost={(updatedPost) => {
          setSelectedPost(updatedPost);
          if (typeof setPostsData !== 'undefined') {
            setPostsData(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
          }
        }}
        onDeletePost={(id) => handleDeletePost(id)}
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
              src={profileData?.avatar_url || profileData?.avatar || currentUser?.avatar_url || currentUser?.avatar || profileImage}
              alt="Enlarged Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#111111] shadow-2xl"
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

      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <CreateStoryModal
          onClose={() => setShowCreateStoryModal(false)}
          onSuccess={() => {
            fetchOwnStories(profileData?.username || currentUser?.username);
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {showStoryViewerModal && ownStories.length > 0 && (
        <StoryViewerModal
          userStories={[{
            username: profileData?.username || currentUser?.username || "me",
            full_name: profileData?.full_name || currentUser?.full_name || "Me",
            avatar: profileData?.avatar_url || profileData?.avatar || currentUser?.avatar_url || currentUser?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
            stories: ownStories
          }]}
          initialUserIndex={0}
          initialStoryIndex={activeStoryIdx}
          onClose={() => setShowStoryViewerModal(false)}
          onStoryDeleted={(storyId) => {
            setOwnStories(prev => prev.filter(s => s.id !== storyId));
          }}
          onStoryViewed={(storyId) => {
            setOwnStories(prev => prev.map(s => s.id === storyId ? { ...s, is_viewed: true } : s));
          }}
        />
      )}
    </div>
  );
}

export default MyProfile;