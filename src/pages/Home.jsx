import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsFeed from "./NotificationsFeed";
import CreatePostModal from "./CreatePostModal";
import LikersModal from "./LikersModal";
import PostModal from "./PostModal";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";
import ExplorePage from "./ExplorePage";
import {
  Bell,
  MessageCircle,
  Home,
  Compass,
  Clapperboard,
  Send,
  Settings,
  LogOut,
  Heart,
  Search,
  Plus,
  Moon,
  Sun,
  LayoutGrid,
  List
} from "lucide-react";
import { getAvatarUrl, getProfileAvatar } from "../utils/avatar";

/* ---------------- OPTIMIZED IMAGES ---------------- */
const profile1 = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";
const story1 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop";
const story2 = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop";
const story3 = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";
const post1 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&auto=format&fit=crop";
const post2 = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=500&auto=format&fit=crop";
const post3 = "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&auto=format&fit=crop";

/* ---------------- DATA ---------------- */
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

const stories = [
  { id: 1, name: "Your Story", image: story1 },
  { id: 2, name: "Sonya Leena", image: USER_AVATARS.sonya_leena },
  { id: 3, name: "Adam Addisin", image: USER_AVATARS.adam_addisin },
  { id: 4, name: "Andrew Dewitt", image: USER_AVATARS.andrew_dewitt },
  { id: 5, name: "Nicole Bell", image: USER_AVATARS.nicole_bell },
  { id: 6, name: "Ashley Wood", image: USER_AVATARS.ashley_wood },
  { id: 7, name: "John Doe", image: USER_AVATARS.john_doe },
];

function HomePage({ setCurrentView }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && document.documentElement.classList.contains("dark"));
  });
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || "Feed";
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [selectedFeedPost, setSelectedFeedPost] = useState(null);
  const [feedViewMode, setFeedViewMode] = useState('list'); // 'list' or 'grid'
  const feedSentinelRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [likersPostId, setLikersPostId] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Stories States
  const [groupedStories, setGroupedStories] = useState([]);
  const [storiesMap, setStoriesMap] = useState({});
  const [unviewedMap, setUnviewedMap] = useState({});
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [activeStoryGroupIdx, setActiveStoryGroupIdx] = useState(null);
  const [activeStoryStartIdx, setActiveStoryStartIdx] = useState(0);

  // Group stories helper
  const groupStoriesByUsername = (storiesList) => {
    const grouped = {};
    const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    const myUsername = (myUserObj?.username || "").toLowerCase();

    // Sort stories by createdAt ascending
    const sorted = [...storiesList].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sorted.forEach(story => {
      const user = story.User;
      if (!user) return;
      const usernameKey = user.username.toLowerCase();
      
      if (!grouped[usernameKey]) {
        grouped[usernameKey] = {
          username: user.username,
          full_name: user.full_name,
          avatar: user.avatar_url || user.avatar,
          stories: []
        };
      }
      grouped[usernameKey].stories.push(story);
    });

    const groupedArray = Object.values(grouped);

    // Own stories first
    const ownGroup = groupedArray.find(g => g.username.toLowerCase() === myUsername);
    const otherGroups = groupedArray.filter(g => g.username.toLowerCase() !== myUsername);

    const finalGrouped = [];
    if (ownGroup) {
      finalGrouped.push(ownGroup);
    }
    finalGrouped.push(...otherGroups);

    const hasStories = {};
    const hasUnviewed = {};
    storiesList.forEach(s => {
      const u = s.User?.username?.toLowerCase();
      if (!u) return;
      if (!hasStories[u]) hasStories[u] = [];
      hasStories[u].push(s);

      // A story is unviewed if it belongs to someone else and is_viewed is false
      if (u !== myUsername) {
        if (s.is_viewed === false) {
          hasUnviewed[u] = true;
        }
      }
    });

    return {
      grouped: finalGrouped,
      hasStories,
      hasUnviewed
    };
  };

  // Fetch active stories feed
  const fetchStoriesFeed = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const response = await fetch("https://tiem.digitaligrow.com/api/v1/stories", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        const { grouped, hasStories, hasUnviewed } = groupStoriesByUsername(resJson.data);
        setGroupedStories(grouped);
        setStoriesMap(hasStories);
        setUnviewedMap(hasUnviewed);
      }
    } catch (err) {
      console.error("Error fetching stories:", err);
    }
  };

  // Play stories for a specific user (handles feed-post/suggestions clicks)
  const playUserStories = async (username) => {
    const lowerUser = username.toLowerCase();
    
    // Check if already in groupedStories
    const idx = groupedStories.findIndex(g => g.username.toLowerCase() === lowerUser);
    if (idx !== -1) {
      // Find first unviewed story index
      const firstUnviewedIdx = groupedStories[idx].stories.findIndex(s => s.is_viewed === false);
      setActiveStoryStartIdx(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
      setActiveStoryGroupIdx(idx);
      return;
    }

    // Otherwise, fetch dynamically from endpoint
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/user/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
        const tempGroup = {
          username: username,
          full_name: resJson.data[0].User?.full_name || username,
          avatar: resJson.data[0].User?.avatar_url || resJson.data[0].User?.avatar,
          stories: resJson.data
        };
        
        setGroupedStories(prev => {
          const updated = [...prev, tempGroup];
          const firstUnviewedIdx = tempGroup.stories.findIndex(s => s.is_viewed === false);
          setActiveStoryStartIdx(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
          setActiveStoryGroupIdx(updated.length - 1);
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching user stories:", err);
    }
  };

  // Handlers for story events in viewer
  const handleStoryDeleted = (storyId, username) => {
    // Refresh all stories
    fetchStoriesFeed();
  };

  const handleStoryViewed = (storyId, username) => {
    const lowerUser = username.toLowerCase();
    
    // Mark locally as viewed
    setGroupedStories(prev => prev.map(g => {
      if (g.username.toLowerCase() === lowerUser) {
        return {
          ...g,
          stories: g.stories.map(s => s.id === storyId ? { ...s, is_viewed: true } : s)
        };
      }
      return g;
    }));

    setStoriesMap(prev => {
      const list = prev[lowerUser];
      if (!list) return prev;
      return {
        ...prev,
        [lowerUser]: list.map(s => s.id === storyId ? { ...s, is_viewed: true } : s)
      };
    });

    // Recalculate if there are still unviewed stories
    setUnviewedMap(prev => {
      const userStoriesList = storiesMap[lowerUser] || [];
      const stillHasUnviewed = userStoriesList.some(s => s.id !== storyId && s.is_viewed === false);
      return {
        ...prev,
        [lowerUser]: stillHasUnviewed
      };
    });
  };

  const fetchFeed = async (page = 1, append = false) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setFeedLoading(true);
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/feed?page=${page}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        // Map API data to component shape
        const mapped = resJson.data.map(p => ({
          id: p.id,
          username: p.User?.username || "user",
          full_name: p.User?.full_name || p.User?.username || "User",
          avatar: p.User?.avatar_url || null,
          location: p.location || "",
          caption: p.caption || "",
          type: p.type || "image",
          tags: p.tags || [],
          is_public: p.is_public,
          image: p.PostMedia && p.PostMedia.length > 0 ? p.PostMedia[0].url : null,
          mediaType: p.PostMedia && p.PostMedia.length > 0 ? p.PostMedia[0].type : p.type,
          likes: p.likes_count || 0,
          isLiked: p.is_liked || false,
          createdAt: p.createdAt,
          isTextPost: p.type === "text" || (!p.PostMedia || p.PostMedia.length === 0),
        }));
        
        if (append) {
          setFeedPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = mapped.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setFeedPosts(mapped);
        }
        
        if (resJson.data.length === 0) {
          setFeedHasMore(false);
        }
      } else {
        if (!append) setFeedPosts([]);
        setFeedHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  // Auto-pagination with IntersectionObserver
  useEffect(() => {
    if (!feedSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedHasMore && !feedLoading) {
          setFeedPage(prev => {
            const nextPage = prev + 1;
            fetchFeed(nextPage, true);
            return nextPage;
          });
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [feedHasMore, feedLoading]);

  const [suggFollowingStates, setSuggFollowingStates] = useState({});

  const handleSuggFollowToggle = async (targetUsername) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const currentState = suggFollowingStates[targetUsername] || 'none';
    const isUnfollowing = currentState === 'following' || currentState === 'requested';
    
    // Optimistic update
    setSuggFollowingStates(prev => ({
      ...prev,
      [targetUsername]: isUnfollowing ? 'none' : 'following'
    }));

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow`, {
        method: isUnfollowing ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        setSuggFollowingStates(prev => ({ ...prev, [targetUsername]: currentState }));
        return;
      }

      // Re-check actual status
      try {
        const statusRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${targetUsername}/follow-status`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const statusJson = await statusRes.json();
        if (statusRes.ok && statusJson.success && statusJson.data) {
          let newState = 'none';
          if (statusJson.data.following) newState = 'following';
          else if (statusJson.data.requested || statusJson.data.status === 'pending') newState = 'requested';
          setSuggFollowingStates(prev => ({ ...prev, [targetUsername]: newState }));
        }
      } catch (e) {
        console.error("Error checking follow status:", e);
      }
    } catch (err) {
      console.error("Error following suggested user:", err);
      setSuggFollowingStates(prev => ({ ...prev, [targetUsername]: currentState }));
    }
  };

  const handleLikePost = async (postId, currentlyLiked) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Optimistically update the UI
    setFeedPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let currentLikes = parseInt(post.likes) || 0;
        return {
          ...post,
          isLiked: !currentlyLiked,
          likes: !currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      }
      return post;
    }));

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/${postId}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: { post_id: postId }
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        // Revert on failure
        setFeedPosts(prev => prev.map(post => {
          if (post.id === postId) {
            let revertedLikes = parseInt(post.likes) || 0;
            return {
              ...post,
              isLiked: currentlyLiked,
              likes: currentlyLiked ? revertedLikes + 1 : Math.max(0, revertedLikes - 1)
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error("Error liking post:", err);
      // Revert on failure
      setFeedPosts(prev => prev.map(post => {
        if (post.id === postId) {
          let revertedLikes = parseInt(post.likes) || 0;
          return {
            ...post,
            isLiked: currentlyLiked,
            likes: currentlyLiked ? revertedLikes + 1 : Math.max(0, revertedLikes - 1)
          };
        }
        return post;
      }));
    }
  };

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch(`https://tiem.digitaligrow.com/api/v1/users/suggested?limit=10`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data)) {
          setSuggestedUsers(resJson.data);
        }
      } catch (err) {
        console.error("Error fetching suggested users:", err);
      }
    };

    fetchSuggestedUsers();
  }, [profileData, currentUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(`https://tiem.digitaligrow.com/api/v1/search/users?q=${encodeURIComponent(searchQuery)}`, {
          method: "GET",
          headers: headers
        });
        const resJson = await response.json();
        if (response.ok && resJson.success) {
          setSearchResults(resJson.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const storiesRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - storiesRef.current.offsetLeft);
    setScrollLeft(storiesRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - storiesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    storiesRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

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
            const statsResponse = await fetch(`https://tiem.digitaligrow.com/api/v1/profile/${data.data.username}/stats`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            const statsData = await statsResponse.json();
            if (statsResponse.ok && statsData.success) {
              setUserStats(statsData.data);
            }
          }
        }
      } catch (err) {
        console.error("Error loading home profile stats:", err);
      }
    };

    fetchProfileAndStats();
    fetchStoriesFeed();
    fetchFeed(1);

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleProfileClick = (targetUsername) => {
    if (!targetUsername) return;
    
    const myUsername = profileData?.username || currentUser?.username || "";

    if (targetUsername.toLowerCase() === myUsername.toLowerCase()) {
      if (setCurrentView) setCurrentView("my-profile");
      navigate("/my-profile");
    } else {
      localStorage.setItem("selected_username", targetUsername);
      if (setCurrentView) setCurrentView("profile");
      navigate(`/profile/${targetUsername}`, { state: { username: targetUsername } });
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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

  const navItems = [
    { name: "Feed", icon: Home },
    { name: "Search", icon: Search },
    { name: "Explore", icon: Compass },
    { name: "Settings", icon: Settings },
  ];

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  };

  return (
    <div className="h-screen bg-[#faf7f7] dark:bg-zinc-950 flex transform-gpu overflow-hidden text-[#2d1b1b] dark:text-zinc-100 transition-colors duration-300">
      
      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex w-[240px] lg:w-[290px] bg-white dark:bg-zinc-950 border-r border-[#eee2df] dark:border-zinc-800 px-4 lg:px-6 py-8 flex-col justify-between shrink-0 transition-colors duration-300 z-50 overflow-y-auto">
        <div>
          {/* LOGO */}
          <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer hover:opacity-80 transition" onClick={() => setCurrentView && setCurrentView("home")}>
            <img src="/logo.png" alt="logo" className="w-8 h-8 lg:w-9 lg:h-9 object-cover rounded-lg shadow-sm border border-[#eee2df] dark:border-zinc-800" />
            <h1 className="text-[28px] lg:text-[32px] font-extrabold tracking-tight hidden lg:block" style={{ lineHeight: "1.2" }}>
              <span className="text-[#d6333b]">TIEM</span>
              <span className="bg-gradient-to-r from-[#ef553e] to-[#f79b42] bg-clip-text text-transparent">gram</span>
            </h1>
          </div>

          {/* PROFILE */}
          <div 
            className="flex flex-col items-center text-center px-2 cursor-pointer hover:opacity-90 transition"
            onClick={() => {
              if (setCurrentView) setCurrentView("my-profile");
              navigate("/my-profile");
            }}
          >
            <img
              loading="lazy"
              src={getProfileAvatar(profileData, currentUser)}
              alt="profile"
              className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-[#f2d8d2] dark:border-zinc-800 shadow-sm transition-colors duration-300"
            />
            <h2 className="mt-4 text-xl lg:text-2xl font-bold">{profileData?.full_name || currentUser?.full_name || "Abhinav Khare"}</h2>
            <p className="text-[#7a5b5b] dark:text-zinc-400 text-sm">@{profileData?.username || currentUser?.username || "abhi_navkhare"}</p>
            <div className="flex justify-between w-full mt-6 px-2 lg:px-0">
              <div>
                <h3 className="font-bold text-base lg:text-lg">{userStats?.posts_count ?? userStats?.posts ?? "472"}</h3>
                <p className="text-[#7a5b5b] dark:text-zinc-500 text-xs">Posts</p>
              </div>
              <div>
                <h3 className="font-bold text-base lg:text-lg">{userStats?.followers_count ?? userStats?.followers ?? "12.4k"}</h3>
                <p className="text-[#7a5b5b] dark:text-zinc-500 text-xs">Followers</p>
              </div>
              <div>
                <h3 className="font-bold text-base lg:text-lg">{userStats?.following_count ?? userStats?.following ?? "228"}</h3>
                <p className="text-[#7a5b5b] dark:text-zinc-500 text-xs">Following</p>
              </div>
            </div>
          </div>

          {/* BIO */}
          <div className="mt-5 px-2 lg:px-3">
            <h4 className="font-bold text-sm text-[#2d1b1b] dark:text-white">{profileData?.full_name || currentUser?.full_name || "Abhinav Khare"}</h4>
            <p className="text-xs text-[#7a5b5b] dark:text-zinc-400 mt-0.5 leading-relaxed">
              {profileData?.bio || "UI Designer | Traveler | Lifestyle Blogger"}
            </p>
          </div>

          {/* STORY HIGHLIGHTS */}
          <div className="mt-5 px-2 lg:px-3">
            <h4 className="font-bold text-sm text-[#2d1b1b] dark:text-white mb-3">Story Highlights</h4>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {/* New highlight button */}
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer group shrink-0"
                onClick={(e) => { e.stopPropagation(); setShowCreateStoryModal(true); }}
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center hover:border-red-400 dark:hover:border-red-500 transition-colors">
                  <Plus size={20} className="text-zinc-400 dark:text-zinc-500 group-hover:text-red-500 transition-colors" />
                </div>
                <span className="text-[10px] text-[#7a5b5b] dark:text-zinc-500 font-medium">New</span>
              </div>
              {/* Dynamic highlights from stories */}
              {groupedStories.slice(0, 4).map((group) => (
                <div 
                  key={group.username}
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    playUserStories(group.username);
                  }}
                >
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500">
                    <img
                      src={group.avatar || story1}
                      alt={group.username}
                      className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-950"
                    />
                  </div>
                  <span className="text-[10px] text-[#7a5b5b] dark:text-zinc-500 font-medium truncate max-w-[56px] lg:max-w-[64px] text-center">{group.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MENU */}
          <div className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-4 px-4 py-3 lg:px-5 lg:py-4 rounded-2xl font-semibold transition duration-300 relative ${
                  activeTab === item.name
                    ? "bg-[#fff1ea] dark:bg-red-500/10 text-red-600 dark:text-red-500"
                    : "hover:bg-[#f7f1ef] dark:hover:bg-zinc-900/50 text-[#5b4343] dark:text-zinc-400 hover:text-[#2d1b1b] dark:hover:text-zinc-200"
                }`}
              >
                {activeTab === item.name && (
                  <motion.div layoutId="activeTab" className="absolute left-0 w-1.5 h-8 bg-red-500 rounded-r-full" />
                )}
                <item.icon size={22} className={activeTab === item.name ? "text-red-600 dark:text-red-500" : ""} />
                <span className="hidden lg:block">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="space-y-2 mt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 lg:px-5 lg:py-4 rounded-2xl font-semibold text-[#5b4343] dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition duration-300"
          >
            <LogOut size={22} />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN FEED AREA ---------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative scrollbar-hide sm:scrollbar-default">
        
        {/* STICKY GLASS NAVBAR */}
        <div className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/80 backdrop-blur-md border-b border-[#eee2df] dark:border-zinc-800/50 px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-4 transition-colors duration-300">
          
          {/* MOBILE LOGO (Visible only on mobile) */}
          <div className="md:hidden flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setCurrentView && setCurrentView("home")}>
            <img src="/logo.png" alt="logo" className="w-8 h-8 object-cover rounded-lg shadow-sm border border-[#eee2df] dark:border-zinc-800" />
          </div>

          {/* SEARCH */}
          <div className="relative w-full max-w-[400px] flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b6666] dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search exact @username and hit Enter..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  e.preventDefault();
                  const token = localStorage.getItem("access_token");
                  if (!token) return;
                  
                  let exactQuery = searchQuery.trim();
                  if (exactQuery.startsWith("@")) exactQuery = exactQuery.substring(1);

                  try {
                    const res = await fetch(`https://tiem.digitaligrow.com/api/v1/search/users/exact?username=${encodeURIComponent(exactQuery)}`, {
                      method: "GET",
                      headers: { "Authorization": `Bearer ${token}` }
                    });
                    const resJson = await res.json();
                    if (res.ok && resJson.success && resJson.data) {
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                      handleProfileClick(resJson.data.username || exactQuery);
                    }
                  } catch (err) {
                    console.error("Exact search error:", err);
                  }
                }
              }}
              className="w-full bg-[#f7f1ef] dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-full py-2.5 pl-12 pr-6 outline-none focus:bg-white dark:focus:bg-zinc-950 focus:border-[#eadedb] dark:focus:border-zinc-700 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/30 transition-all text-sm dark:text-zinc-200"
            />
            
            {/* Live Search Dropdown Suggestions */}
            {showSearchDropdown && searchQuery.trim() && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSearchDropdown(false)}
                />
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-805 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 max-h-[320px] overflow-y-auto animate-[fadeIn_.2s_ease]">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-zinc-400">
                      <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs font-semibold">Searching users...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-6 text-sm text-[#7a5b5b] dark:text-zinc-500 font-medium">
                      No matching users found 🔍
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user.username}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                          handleProfileClick(user.username);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#fbf3f1] dark:hover:bg-zinc-800/40 cursor-pointer transition duration-150 group"
                      >
                        <img
                          src={getAvatarUrl(user.avatar_url || user.avatar)}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#2d1c1c] dark:text-zinc-200 group-hover:text-red-500 transition-colors truncate">
                            {user.full_name || user.username}
                          </h4>
                          <p className="text-xs text-[#7a5b5b] dark:text-zinc-500 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-5">
            <button 
              onClick={toggleDarkMode} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div 
              onClick={() => setActiveTab("Notifications")}
              className={`relative cursor-pointer hover:text-red-500 transition-colors ${activeTab === "Notifications" ? "text-red-500" : "text-[#2e1d1d] dark:text-zinc-200"}`}
            >
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 transition-colors duration-300"></span>
            </div>
            <div className="relative cursor-pointer text-[#2e1d1d] dark:text-zinc-200 hover:text-red-500 transition-colors hidden sm:block">
              <MessageCircle size={22} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950 transition-colors duration-300">3</span>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-600 text-white px-5 py-2.5 rounded-full font-semibold hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 transition duration-300 text-sm"
            >
              <Plus size={18} />
              Create
            </button>
            <button onClick={toggleDarkMode} className="md:hidden text-[#2e1d1d] dark:text-zinc-200">
               {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1000px] mx-auto w-full pb-32 md:pb-16">
          
          {activeTab === "Notifications" ? (
            <NotificationsFeed />
          ) : activeTab === "Search" ? (
            <SearchUsersView handleProfileClick={handleProfileClick} />
          ) : activeTab === "Explore" ? (
            <ExplorePage handleProfileClick={handleProfileClick} />
          ) : (
            <>
              {/* STORIES */}
              <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Stories</h2>
            <div 
              ref={storiesRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} snap-x`}
            >
              {/* Your Story Card (Always First) */}
              {(() => {
                const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
                const myUsername = (myUserObj?.username || "").toLowerCase();
                const ownGroupIdx = groupedStories.findIndex(g => g.username.toLowerCase() === myUsername);
                const hasOwnStories = ownGroupIdx !== -1;

                const avatarUrl = getProfileAvatar(profileData, currentUser);

                return (
                  <div className="flex flex-col items-center min-w-[72px] sm:min-w-[80px] snap-start relative">
                    <div 
                      onClick={() => {
                        if (hasOwnStories) {
                          const firstUnviewedIdx = groupedStories[ownGroupIdx].stories.findIndex(s => s.is_viewed === false);
                          setActiveStoryStartIdx(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
                          setActiveStoryGroupIdx(ownGroupIdx);
                        } else {
                          setShowCreateStoryModal(true);
                        }
                      }}
                      className={`p-[3px] rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                        hasOwnStories 
                          ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500 shadow-md"
                          : "border border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="relative">
                        <img
                          loading="lazy"
                          src={avatarUrl}
                          alt="Your Story"
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 sm:border-4 border-white dark:border-zinc-950 transition-colors duration-300"
                        />
                        {/* Floating Plus Badge */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateStoryModal(true);
                          }}
                          className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-650 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-white text-xs font-extrabold shadow cursor-pointer hover:scale-110 active:scale-90 transition-transform"
                        >
                          +
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[#4a3636] dark:text-zinc-400 text-xs sm:text-sm font-medium truncate w-full text-center">
                      Your Story
                    </p>
                  </div>
                );
              })()}

              {/* Other Users' Stories */}
              {groupedStories
                .filter(g => {
                  const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
                  return g.username.toLowerCase() !== (myUserObj?.username || "").toLowerCase();
                })
                .map((group) => {
                  const isUnviewed = unviewedMap[group.username.toLowerCase()];
                  const origIdx = groupedStories.findIndex(g => g.username.toLowerCase() === group.username.toLowerCase());
                  
                  return (
                    <motion.div
                      key={group.username}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        const firstUnviewedIdx = group.stories.findIndex(s => s.is_viewed === false);
                        setActiveStoryStartIdx(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
                        setActiveStoryGroupIdx(origIdx);
                      }}
                      className="flex flex-col items-center min-w-[72px] sm:min-w-[80px] cursor-pointer snap-start"
                    >
                      <div className={`p-[3px] rounded-full transition-colors duration-300 shadow-md ${
                        isUnviewed 
                          ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500" 
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}>
                        <img
                          loading="lazy"
                          src={getAvatarUrl(group.avatar)}
                          alt={group.username}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 sm:border-4 border-white dark:border-zinc-950 transition-colors duration-300"
                        />
                      </div>
                      <p className="mt-2 text-[#4a3636] dark:text-zinc-400 text-xs sm:text-sm font-medium truncate w-full text-center">
                        {group.username}
                      </p>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* FEED */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Feed</h2>
              <div className="flex items-center bg-[#f7f1ef] dark:bg-zinc-800 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setFeedViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${feedViewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-500' : 'text-[#7a5b5b] dark:text-zinc-400 hover:text-[#2d1b1b] dark:hover:text-zinc-200'}`}
                  title="List view"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setFeedViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${feedViewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-500' : 'text-[#7a5b5b] dark:text-zinc-400 hover:text-[#2d1b1b] dark:hover:text-zinc-200'}`}
                  title="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>

            {/* Initial Loading Spinner */}
            {feedLoading && feedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <svg className="animate-spin h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading feed...</span>
              </div>
            )}

            {/* Empty State */}
            {!feedLoading && feedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#eadcdc] dark:border-zinc-800/80 rounded-3xl bg-[#fcf9f8]/40 dark:bg-zinc-900/10 p-8">
                <div className="w-16 h-16 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 flex items-center justify-center text-[#7a5b5b] dark:text-zinc-500 mb-4">
                  <Heart size={28} />
                </div>
                <h3 className="font-bold text-lg text-[#2d1c1c] dark:text-zinc-200">No posts yet</h3>
                <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 max-w-xs mt-1">
                  Follow other users to see their posts in your feed.
                </p>
              </div>
            )}

            <div className={feedViewMode === 'grid' ? 'columns-2 lg:columns-3' : 'space-y-8'} style={feedViewMode === 'grid' ? { columnGap: '16px' } : undefined}>
              {feedPosts.map((post, i) => (
                feedViewMode === 'grid' ? (
                  /* ====== MASONRY GRID CARD ====== */
                  <motion.div
                    key={`grid-${post.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5), type: 'spring', stiffness: 120 }}
                    className="break-inside-avoid mb-5 bg-white dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-shadow duration-300 group cursor-pointer"
                    onClick={() => setSelectedFeedPost(post)}
                  >
                    {/* MEDIA */}
                    {(post.isTextPost || (!post.image && post.type !== 'video')) ? (
                      <div className="w-full aspect-[3/4] max-h-[220px] flex items-center justify-center p-5 text-center text-white font-bold text-sm sm:text-base bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-b-none">
                        <p className="line-clamp-5">{post.caption || 'Text Post'}</p>
                      </div>
                    ) : post.mediaType === 'video' ? (
                      <div className="relative overflow-hidden max-h-[280px]">
                        <video
                          src={post.image}
                          className="w-full max-h-[280px] object-cover"
                          preload="metadata"
                          muted
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">▶ VIDEO</div>
                      </div>
                    ) : (
                      <div className="overflow-hidden max-h-[280px]">
                        <img
                          loading="lazy"
                          src={post.image}
                          alt="post"
                          className="w-full max-h-[280px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* BOTTOM INFO */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          loading="lazy"
                          src={getAvatarUrl(post.avatar)}
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        <span className="font-bold text-xs text-[#2d1b1b] dark:text-zinc-200 truncate">{post.username}</span>
                      </div>
                      {post.caption && !post.isTextPost && (
                        <p className="text-[#4f3c3c] dark:text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-1.5">{post.caption}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLikePost(post.id, post.isLiked); }}
                            className={`flex items-center gap-1 text-xs font-semibold transition ${post.isLiked ? 'text-red-500' : 'text-[#7a5b5b] dark:text-zinc-400 hover:text-red-500'}`}
                          >
                            <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
                            {post.likes}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#8b6666] dark:text-zinc-500 font-medium">{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                  className="bg-white dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-shadow duration-300"
                >
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const lowerUser = (post.username || "").toLowerCase();
                        const userStoriesList = storiesMap[lowerUser];
                        const hasStories = userStoriesList && userStoriesList.length > 0;
                        const isUnviewed = unviewedMap[lowerUser];

                        const avatarSrc = getAvatarUrl(post.avatar);
                        const avatarImg = (
                          <img
                            loading="lazy"
                            src={avatarSrc}
                            alt="profile"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white dark:border-zinc-950 transition-colors duration-300"
                          />
                        );

                        if (hasStories) {
                          return (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                playUserStories(post.username);
                              }}
                              className={`p-[2px] rounded-full cursor-pointer hover:scale-105 transition-transform shadow ${
                                isUnviewed 
                                  ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500" 
                                  : "bg-zinc-300 dark:bg-zinc-700"
                              }`}
                            >
                              {avatarImg}
                            </div>
                          );
                        } else {
                          return (
                            <div 
                              onClick={() => handleProfileClick(post.username)}
                              className="cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              <img
                                loading="lazy"
                                src={avatarSrc}
                                alt="profile"
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 transition-colors duration-300"
                              />
                            </div>
                          );
                        }
                      })()}
                      <div 
                        onClick={() => handleProfileClick(post.username)}
                        className="cursor-pointer group"
                      >
                        <h3 className="font-bold text-sm sm:text-base group-hover:text-red-500 transition-colors">{post.username}</h3>
                        {post.location && <p className="text-[#7a5b5b] dark:text-zinc-500 text-xs transition-colors">{post.location}</p>}
                      </div>
                    </div>
                    <button className="text-[#8b6666] dark:text-zinc-400 hover:text-[#2d1b1b] dark:hover:text-white p-2 transition-colors">
                      •••
                    </button>
                  </div>

                  {/* POST CONTENT */}
                  <div onClick={() => setSelectedFeedPost(post)} className="cursor-pointer">
                    {(post.isTextPost || (!post.image && post.type !== 'video')) ? (
                      <div className="w-full h-[250px] sm:h-[300px] flex items-center justify-center p-8 text-center text-white font-bold text-xl sm:text-2xl rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                        <p className="line-clamp-6">{post.caption || "Text Post"}</p>
                      </div>
                    ) : post.mediaType === "video" ? (
                      <div className="overflow-hidden rounded-2xl relative">
                        <video
                          src={post.image}
                          className="w-full h-[300px] sm:h-[400px] lg:h-[450px] object-cover"
                          controls
                          preload="metadata"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <motion.div 
                        className="overflow-hidden rounded-2xl relative"
                        whileHover={{ scale: 0.995 }}
                      >
                        <img
                          loading="lazy"
                          src={post.image}
                          alt="post"
                          className="w-full h-[300px] sm:h-[400px] lg:h-[450px] object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-4 mt-4">
                    <motion.button 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleLikePost(post.id, post.isLiked)}
                      className={`transition-colors ${post.isLiked ? "text-red-500" : "text-[#2d1b1b] dark:text-zinc-200 hover:text-red-500"}`}
                    >
                      <Heart size={24} fill={post.isLiked ? "currentColor" : "none"} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-[#2d1b1b] dark:text-zinc-200 hover:text-green-500 transition-colors">
                      <Send size={24} />
                    </motion.button>
                  </div>

                  {/* CAPTION */}
                  <div className="mt-3">
                    <p 
                      className="text-[#2d1b1b] dark:text-zinc-200 text-xs sm:text-sm font-bold mb-1 transition-colors cursor-pointer hover:underline"
                      onClick={() => setLikersPostId(post.id)}
                    >
                      {post.likes} likes
                    </p>
                    {(!post.isTextPost) && post.caption && (
                      <p className="text-[#2d1b1b] dark:text-zinc-300 text-sm leading-relaxed transition-colors">
                        <span className="font-bold mr-2">{post.username}</span>
                        {post.caption}
                      </p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <p className="text-blue-500 dark:text-blue-400 text-sm mt-1">
                        {post.tags.map(tag => `#${tag}`).join(" ")}
                      </p>
                    )}
                    <p className="text-[#8b6666] dark:text-zinc-500 text-xs mt-2 uppercase tracking-wide transition-colors">{timeAgo(post.createdAt)}</p>
                  </div>
                </motion.div>
                ) /* end list card ternary */
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            {feedHasMore && (
              <div ref={feedSentinelRef} className="h-4" />
            )}

            {/* Bottom Loading Spinner */}
            {feedLoading && feedPosts.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-[#7a5b5b] dark:text-zinc-500 font-medium">Loading more posts...</span>
                </div>
              </div>
            )}

            {/* End of Feed */}
            {!feedHasMore && feedPosts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#8b6666] dark:text-zinc-600 font-medium">✨ You're all caught up!</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* FLOATING ACTION BUTTON (MOBILE) */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/40 z-50"
        >
          <Plus size={24} />
        </motion.button>

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-[#eee2df] dark:border-zinc-800 z-50 px-6 py-3 flex items-center justify-between safe-area-bottom transition-colors duration-300">
          {[Home, Compass, Plus, MessageCircle, profile1].map((Item, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center justify-center cursor-pointer"
              onClick={() => {
                if (idx === 0) {
                  if (setCurrentView) setCurrentView("home");
                  navigate("/home");
                } else if (idx === 2) {
                  setShowCreateModal(true);
                } else if (idx === 4) {
                  if (setCurrentView) setCurrentView("my-profile");
                  navigate("/my-profile");
                }
              }}
            >
              {idx === 2 ? (
                 <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
                   <Item size={20} />
                 </div>
              ) : idx === 4 ? (
                <img src={Item} alt="profile" className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
              ) : (
                <Item size={24} className={idx === 0 ? "text-red-500" : "text-[#5b4343] dark:text-zinc-400 transition-colors"} />
              )}
            </div>
          ))}
        </div>

      </main>

      {/* ---------------- RIGHT SUGGESTIONS PANEL ---------------- */}
      <aside className="hidden xl:flex w-[320px] border-l border-[#eee2df] dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-8 flex-col shrink-0 overflow-y-auto transition-colors duration-300 z-50">
        
        {/* CURRENT USER MINI PROFILE */}
        <div className="flex items-center justify-between mb-10">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
            onClick={() => {
              if (setCurrentView) setCurrentView("my-profile");
              navigate("/my-profile");
            }}
          >
            <img src={profileData?.avatar_url || profileData?.avatar || profile1} alt="profile" className="w-12 h-12 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800 transition-colors" />
            <div>
              <h4 className="font-bold text-sm">{profileData?.username || currentUser?.username || "abhi_navkhare"}</h4>
              <p className="text-xs text-[#7a5b5b] dark:text-zinc-500 transition-colors">{profileData?.full_name || currentUser?.full_name || "Abhinav Khare"}</p>
            </div>
          </div>
          <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">Switch</button>
        </div>

        {/* SUGGESTIONS HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#7a5b5b] dark:text-zinc-400 font-bold text-sm transition-colors">Suggested for you</h3>
          <button className="text-xs font-bold hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors">See All</button>
        </div>

        {/* SUGGESTION LIST */}
        <div className="space-y-5">
          {suggestedUsers.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-xs text-[#7a5b5b] dark:text-zinc-500">No suggestions right now</p>
            </div>
          ) : suggestedUsers.map((sug, i) => {
            const lowerUser = (sug.username || "").toLowerCase();
            const userStoriesList = storiesMap[lowerUser];
            const hasStories = userStoriesList && userStoriesList.length > 0;
            const isUnviewed = unviewedMap[lowerUser];
            const subtitle = sug.department 
              ? `${sug.department}${sug.year ? ` • Year ${sug.year}` : ''}`
              : `${sug.followers_count ?? 0} followers`;

            return (
              <motion.div 
                key={sug.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {hasStories ? (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        playUserStories(sug.username);
                      }}
                      className={`p-[2px] rounded-full cursor-pointer hover:scale-105 transition-transform shadow ${
                        isUnviewed 
                          ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500" 
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <img 
                        src={getAvatarUrl(sug.avatar_url)} 
                        alt={sug.username} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-950" 
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleProfileClick(sug.username)}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img 
                        src={getAvatarUrl(sug.avatar_url)} 
                        alt={sug.username} 
                        className="w-10 h-10 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800 transition-colors" 
                      />
                    </div>
                  )}
                  <div 
                    onClick={() => handleProfileClick(sug.username)}
                    className="cursor-pointer"
                  >
                    <h4 className="font-bold text-sm hover:underline decoration-zinc-400 underline-offset-2">{sug.username}</h4>
                    <p className="text-[11px] text-[#7a5b5b] dark:text-zinc-500 w-[130px] truncate transition-colors">{subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSuggFollowToggle(sug.username)}
                  className={`text-xs font-bold transition-colors ${
                    suggFollowingStates[sug.username] === 'following'
                      ? "text-[#7a5b5b] dark:text-zinc-500 hover:text-red-500" 
                      : suggFollowingStates[sug.username] === 'requested'
                        ? "text-yellow-600 dark:text-yellow-400 hover:text-red-500"
                        : "text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  }`}
                >
                  {suggFollowingStates[sug.username] === 'following' 
                    ? "Following" 
                    : suggFollowingStates[sug.username] === 'requested' 
                      ? "Requested" 
                      : "Follow"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-auto pt-10">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8b6666] dark:text-zinc-600 font-medium transition-colors">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Help</a>
            <a href="#" className="hover:underline">Press</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">Jobs</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <p className="text-[11px] text-[#8b6666] dark:text-zinc-600 mt-4 font-medium uppercase tracking-wider transition-colors">
            © 2026 TIEMGRAM FROM TIEM TEAM
          </p>
        </div>
      </aside>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newPost) => {
            fetchFeed(1);
          }}
        />
      )}
      
      {/* Likers Modal */}
      {likersPostId && (
        <LikersModal 
          postId={likersPostId} 
          isOpen={!!likersPostId} 
          onClose={() => setLikersPostId(null)} 
        />
      )}

      {/* Feed Post Detail Modal */}
      {selectedFeedPost && (
        <PostModal
          post={selectedFeedPost}
          onClose={() => setSelectedFeedPost(null)}
          onUpdatePost={(updatedPost) => {
            setSelectedFeedPost(updatedPost);
            setFeedPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : p));
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <CreateStoryModal
          onClose={() => setShowCreateStoryModal(false)}
          onSuccess={(newStory) => {
            fetchStoriesFeed(); // reload stories tray
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {activeStoryGroupIdx !== null && (
        <StoryViewerModal
          userStories={groupedStories}
          initialUserIndex={activeStoryGroupIdx}
          initialStoryIndex={activeStoryStartIdx}
          onClose={() => setActiveStoryGroupIdx(null)}
          onStoryDeleted={handleStoryDeleted}
          onStoryViewed={handleStoryViewed}
        />
      )}
    </div>
  );
}

function SearchUsersView({ handleProfileClick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(`https://tiem.digitaligrow.com/api/v1/search/users?q=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: headers
        });
        const resJson = await response.json();
        if (response.ok && resJson.success) {
          const list = resJson.data || [];
          setResults(list);
          
          const myUserObj = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
          const myUsername = myUserObj?.username || "";
          
          const initialFollows = {};
          for (const u of list) {
            try {
              if (myUsername && u.username.toLowerCase() !== myUsername.toLowerCase()) {
                const followRes = await fetch(`https://tiem.digitaligrow.com/api/v1/users/${u.username}/followers`, {
                  method: "GET",
                  headers: headers
                });
                const followJson = await followRes.json();
                if (followRes.ok && followJson.success && Array.isArray(followJson.data)) {
                  initialFollows[u.username] = followJson.data.some(follower => 
                    (follower.username || follower.user?.username || "").toLowerCase() === myUsername.toLowerCase()
                  );
                }
              }
            } catch (err) {
              console.error("Error checking followers for " + u.username, err);
            }
          }
          setFollowingStates(initialFollows);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error searching users in screen:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFollowToggle = async (targetUsername) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const currentlyFollowing = followingStates[targetUsername] || false;
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
          params: {
            username: targetUsername
          }
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        setFollowingStates(prev => ({
          ...prev,
          [targetUsername]: currentlyFollowing
        }));
      }
    } catch (err) {
      console.error("Error following user in search screen:", err);
      setFollowingStates(prev => ({
        ...prev,
        [targetUsername]: currentlyFollowing
      }));
    }
  };

  return (
    <div className="animate-fadeIn max-w-[700px] mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#2d1c1c] dark:text-white">
          Search Users
        </h2>
        <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 mt-1">
          Find and follow other TIEMgram members by name or username
        </p>
      </div>

      <div className="relative mb-8 shadow-sm rounded-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Search name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 transition-all text-base dark:text-white dark:placeholder-zinc-550"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Searching directory...</span>
        </div>
      ) : !query.trim() ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#eadcdc] dark:border-zinc-800/80 rounded-3xl bg-[#fcf9f8]/40 dark:bg-zinc-900/10 p-8">
          <div className="w-16 h-16 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 flex items-center justify-center text-[#7a5b5b] dark:text-zinc-500 mb-4">
            <Search size={28} />
          </div>
          <h3 className="font-bold text-lg text-[#2d1c1c] dark:text-zinc-200">Start Searching</h3>
          <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 max-w-xs mt-1">
            Enter a name or username in the search input above to search our community database.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#eadcdc] dark:border-zinc-800/80 rounded-3xl bg-[#fcf9f8]/40 dark:bg-zinc-900/10 p-8">
          <div className="w-16 h-16 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 flex items-center justify-center text-[#7a5b5b] dark:text-zinc-500 mb-4">
            <Search size={28} className="rotate-90" />
          </div>
          <h3 className="font-bold text-lg text-[#2d1c1c] dark:text-zinc-200">No Match Found</h3>
          <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 max-w-xs mt-1">
            We couldn't find any users named "{query}". Please check the spelling or try a different username.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((user) => {
            const isMe = user.username === (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))?.username : "");
            return (
              <div
                key={user.username}
                className="bg-white dark:bg-zinc-900 border border-[#eee2df] dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition duration-200"
              >
                <div 
                  onClick={() => handleProfileClick(user.username)}
                  className="flex items-center gap-4 cursor-pointer group flex-1 min-w-0"
                >
                  <img
                    src={getAvatarUrl(user.avatar_url || user.avatar)}
                    alt="avatar"
                    className="w-14 h-14 rounded-full object-cover border border-[#eee2df] dark:border-zinc-800/80"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-base text-[#2d1c1c] dark:text-white group-hover:text-red-500 transition-colors truncate">
                      {user.full_name || user.username}
                    </h4>
                    <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleProfileClick(user.username)}
                    className="px-4 py-2 border border-[#eadcdc] dark:border-zinc-800 hover:bg-[#fbf3f1] dark:hover:bg-zinc-800 rounded-xl font-bold text-xs text-[#2d1b1b] dark:text-zinc-200 transition duration-150"
                  >
                    View
                  </button>
                  {!isMe && (
                    followingStates[user.username] ? (
                      <button
                        onClick={() => handleFollowToggle(user.username)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-xs text-[#2d1b1b] dark:text-zinc-200 transition duration-150"
                      >
                        Following
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollowToggle(user.username)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-400 text-white rounded-xl font-bold text-xs hover:scale-[1.02] shadow-sm transition duration-150"
                      >
                        Follow
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HomePage;