import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Heart, Eye, Play, TrendingUp } from "lucide-react";
import PostModal from "./PostModal";
import { getAvatarUrl } from "../utils/avatar";

const defaultAvatar = "/avatar.jpg";

function ExplorePage({ handleProfileClick }) {
  // Explore posts state
  const [explorePosts, setExplorePosts] = useState([]);
  const [explorePage, setExplorePage] = useState(1);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const sentinelRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Post detail modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Map API data to a consistent shape
  const mapPost = useCallback((p) => ({
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
  }), []);

  // Fetch explore posts
  const fetchExplore = useCallback(async (page = 1, append = false) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setExploreLoading(true);
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/explore?page=${page}&limit=20`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        const mapped = resJson.data.map(mapPost);
        if (append) {
          setExplorePosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = mapped.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setExplorePosts(mapped);
        }
        if (resJson.data.length < 20) {
          setExploreHasMore(false);
        }
      } else {
        if (!append) setExplorePosts([]);
        setExploreHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching explore:", err);
    } finally {
      setExploreLoading(false);
    }
  }, [mapPost]);

  // Initial load
  useEffect(() => {
    fetchExplore(1);
  }, [fetchExplore]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || searchActive) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && exploreHasMore && !exploreLoading) {
          setExplorePage(prev => {
            const nextPage = prev + 1;
            fetchExplore(nextPage, true);
            return nextPage;
          });
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [exploreHasMore, exploreLoading, searchActive, fetchExplore]);

  // Search posts
  const searchPosts = useCallback(async (query) => {
    const token = localStorage.getItem("access_token");
    if (!token || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/search/posts?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        setSearchResults(resJson.data.map(mapPost));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching posts:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [mapPost]);

  // Debounced search
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }
    setSearchActive(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchPosts(value);
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchActive(false);
    setSearchResults([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Like handler
  const handleLikePost = async (postId, currentlyLiked) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Optimistic update
    const updatePosts = (setter) => {
      setter(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes + 1
          };
        }
        return post;
      }));
    };

    updatePosts(setExplorePosts);
    if (searchActive) updatePosts(setSearchResults);
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        isLiked: !currentlyLiked,
        likes: currentlyLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1
      }));
    }

    try {
      const endpoint = currentlyLiked
        ? `https://tiem.digitaligrow.com/api/v1/posts/${postId}/unlike`
        : `https://tiem.digitaligrow.com/api/v1/posts/${postId}/like`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        // Revert
        updatePosts(setExplorePosts);
        if (searchActive) updatePosts(setSearchResults);
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Determine which posts to display
  const displayPosts = searchActive ? searchResults : explorePosts;

  // Gradient patterns for text posts
  const gradients = [
    "from-purple-600 via-pink-500 to-orange-400",
    "from-blue-600 via-cyan-500 to-teal-400",
    "from-rose-500 via-red-500 to-orange-500",
    "from-indigo-600 via-purple-500 to-pink-400",
    "from-emerald-500 via-teal-500 to-cyan-400",
    "from-amber-500 via-orange-500 to-red-500",
  ];

  return (
    <div className="w-full">
      {/* SEARCH BAR */}
      <div className="sticky top-0 z-20 pb-4 pt-1 bg-[#faf7f7] dark:bg-zinc-950 transition-colors duration-300">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-[#8b6666] dark:text-zinc-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search posts, tags, locations..."
              className="w-full pl-11 pr-10 py-3 bg-[#f3edeb] dark:bg-zinc-900 border border-[#eadcdc] dark:border-zinc-800 rounded-2xl text-sm text-[#2d1b1b] dark:text-zinc-100 placeholder-[#8b6666] dark:placeholder-zinc-500 outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={16} className="text-[#8b6666] dark:text-zinc-500" />
              </button>
            )}
          </div>
          {/* Search indicator */}
          {searchActive && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <TrendingUp size={14} className="text-red-500" />
              <span className="text-xs text-[#7a5b5b] dark:text-zinc-500 font-medium">
                {isSearching ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
              </span>
              <button
                onClick={clearSearch}
                className="ml-auto text-xs text-red-500 font-semibold hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOADING SPINNER (initial) */}
      {exploreLoading && explorePosts.length === 0 && !searchActive && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <svg className="animate-spin h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Discovering posts...</span>
        </div>
      )}

      {/* EMPTY STATE */}
      {!exploreLoading && displayPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#fbf3f1] dark:bg-zinc-900 flex items-center justify-center text-[#7a5b5b] dark:text-zinc-500 mb-5">
            <Search size={32} />
          </div>
          <h3 className="font-bold text-lg text-[#2d1c1c] dark:text-zinc-200">
            {searchActive ? "No posts found" : "Nothing to explore yet"}
          </h3>
          <p className="text-sm text-[#7a5b5b] dark:text-zinc-500 max-w-xs mt-1">
            {searchActive ? "Try different keywords or tags" : "Posts from the community will appear here"}
          </p>
        </div>
      )}

      {/* MASONRY GRID */}
      {displayPosts.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-3" style={{ columnGap: "4px" }}>
          {displayPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="break-inside-avoid mb-1 relative group cursor-pointer overflow-hidden"
              onClick={() => setSelectedPost(post)}
            >
              {/* MEDIA */}
              {post.isTextPost ? (
                <div className={`w-full aspect-[3/4] flex items-center justify-center p-5 text-center text-white font-bold text-sm sm:text-base bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                  <p className="line-clamp-6 leading-relaxed">{post.caption || "Text Post"}</p>
                </div>
              ) : post.mediaType === "video" ? (
                <div className="relative">
                  <video
                    src={post.image}
                    className="w-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Play size={10} fill="white" /> VIDEO
                  </div>
                </div>
              ) : post.image ? (
                <img
                  loading="lazy"
                  src={post.image}
                  alt=""
                  className="w-full object-cover"
                />
              ) : (
                <div className={`w-full aspect-square flex items-center justify-center p-5 text-center text-white font-bold text-sm bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                  <p className="line-clamp-4">{post.caption || "Post"}</p>
                </div>
              )}

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart size={18} fill="white" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye size={18} />
                    <span>View</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* INFINITE SCROLL SENTINEL */}
      {exploreHasMore && !searchActive && (
        <div ref={sentinelRef} className="h-4" />
      )}

      {/* BOTTOM LOADING */}
      {exploreLoading && displayPosts.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-[#7a5b5b] dark:text-zinc-500 font-medium">Loading more...</span>
          </div>
        </div>
      )}

      {/* END OF FEED */}
      {!exploreHasMore && !searchActive && displayPosts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#8b6666] dark:text-zinc-600 font-medium">✨ You've explored it all!</p>
        </div>
      )}

      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdatePost={(updatedPost) => {
            setSelectedPost(updatedPost);
            const updateList = (setter) => {
              setter(prev => prev.map(p => p.id === updatedPost.id 
                ? { ...p, likes: updatedPost.likes, isLiked: updatedPost.isLiked }
                : p
              ));
            };
            updateList(setExplorePosts);
            if (searchActive) updateList(setSearchResults);
          }}
        />
      )}
    </div>
  );
}

export default ExplorePage;
