import React, { useState, useEffect } from "react";
import { X, Heart, Send, MoreHorizontal, Globe, Lock, Check } from "lucide-react";
import LikersModal from "./LikersModal";
import StoryViewerModal from "./StoryViewerModal";

function PostModal({ post, onClose, onUpdatePost, onDeletePost }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  
  const [editCaption, setEditCaption] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = currentUser.username === post?.username || currentUser.username === post?.User?.username;

  // Stories States
  const [authorStories, setAuthorStories] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  useEffect(() => {
    const fetchAuthorStories = async () => {
      const username = post?.username || post?.User?.username;
      const token = localStorage.getItem("access_token");
      if (!username || !token) return;
      try {
        const response = await fetch(`https://tiem.digitaligrow.com/api/v1/stories/user/${encodeURIComponent(username)}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data)) {
          setAuthorStories(resJson.data);
        }
      } catch (err) {
        console.error("Error fetching post author stories:", err);
      }
    };
    if (post) {
      fetchAuthorStories();
    }
  }, [post]);

  useEffect(() => {
    if (post) {
      setEditCaption(post.caption || "");
      setEditTags(Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || ""));
      setEditIsPublic(post.is_public !== false);
    }
  }, [post]);

  const handleSaveEdit = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsSaving(true);
    try {
      const payload = {
        body: {
          caption: editCaption,
          is_public: editIsPublic,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean)
        }
      };

      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setIsEditing(false);
        setShowDropdown(false);
        if (onUpdatePost) {
          onUpdatePost({
            ...post,
            caption: editCaption,
            is_public: editIsPublic,
            tags: payload.body.tags
          });
        }
      } else {
        alert(resJson.message || "Failed to update post");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikePost = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !post) return;

    const currentlyLiked = post.isLiked;
    const currentLikes = parseInt(post.likes) || 0;
    
    // Optimistic Update via parent callback
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        isLiked: !currentlyLiked,
        likes: !currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
      });
    }

    try {
      const response = await fetch(`https://tiem.digitaligrow.com/api/v1/posts/${post.id}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: { post_id: post.id }
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        // Revert on failure
        if (onUpdatePost) {
          onUpdatePost({
            ...post,
            isLiked: currentlyLiked,
            likes: currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
          });
        }
      }
    } catch (err) {
      console.error("Error liking post:", err);
      // Revert on failure
      if (onUpdatePost) {
        onUpdatePost({
          ...post,
          isLiked: currentlyLiked,
          likes: currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        });
      }
    }
  };

  if (!post) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      {/* CLOSE BUTTON */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:text-gray-300 transition"
      >
        <X size={32} />
      </button>

      {/* MODAL CONTAINER */}
      <div 
        className="flex flex-col md:flex-row w-full max-w-6xl h-full max-h-[90vh] bg-white dark:bg-[#111111] rounded-r-2xl md:rounded-l-none rounded-2xl overflow-hidden shadow-2xl animate-[zoomIn_.3s_ease-out] transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: MEDIA */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {post.isTextPost || post.type === "text" ? (
            <div className="w-full h-full flex items-center justify-center p-10 text-center text-white font-bold text-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <p className="line-clamp-6">{post.caption || "Text Post"}</p>
            </div>
          ) : post.mediaType === "video" || post.type === "video" ? (
            <video
              src={post.image}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* RIGHT: SIDEBAR */}
        <div className="w-full md:w-[450px] flex flex-col border-l border-[#eadcdc] dark:border-[#2c2c2c] bg-white dark:bg-[#111111] transition-colors duration-300">
          
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b border-[#eadcdc] dark:border-[#2c2c2c] transition-colors duration-300">
            <div className="flex items-center gap-3">
              {(() => {
                const hasStories = authorStories.length > 0;
                const hasUnviewed = authorStories.some(s => s.is_viewed === false);
                const avatarUrl = post.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
                return (
                  <div 
                    onClick={() => {
                      if (hasStories) {
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
                        : ""
                    }`}
                  >
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className={`w-10 h-10 rounded-full object-cover bg-white dark:bg-[#111111] ${hasStories ? "border-2 border-white dark:border-[#111111]" : "border border-zinc-200 dark:border-zinc-700"}`}
                    />
                  </div>
                );
              })()}
              <span className="font-bold text-[#2d1c1c] dark:text-white transition-colors duration-300">{post.username || post.User?.username || "user"}</span>
            </div>
            
            {isOwner && (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-gray-500 hover:text-black dark:hover:text-white transition"
                >
                  <MoreHorizontal size={20} />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button 
                      onClick={() => { setIsEditing(true); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Edit Post
                    </button>
                    {onDeletePost && (
                      <button 
                        onClick={() => { setShowDropdown(false); onDeletePost(post.id); }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Delete Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMMENTS (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isEditing ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">Edit Post</span>
                  <button onClick={() => setIsEditing(false)} className="text-xs text-red-500 font-bold">Cancel</button>
                </div>
                
                <textarea 
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Caption..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400"
                  rows={3}
                />
                
                <input 
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400"
                />

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {editIsPublic ? <Globe size={16} /> : <Lock size={16} />}
                    <span>{editIsPublic ? "Public" : "Private"}</span>
                  </div>
                  <button
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    className={`w-10 h-5 rounded-full p-0.5 transition duration-200 ${editIsPublic ? "bg-[#0095f6]" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full transform transition ${editIsPublic ? "translate-x-5" : ""}`} />
                  </button>
                </div>

                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-full py-2.5 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : <><Check size={16}/> Save Changes</>}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {(() => {
                  const hasStories = authorStories.length > 0;
                  const hasUnviewed = authorStories.some(s => s.is_viewed === false);
                  const avatarUrl = post.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";
                  return (
                    <div 
                      onClick={() => {
                        if (hasStories) {
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
                          : ""
                      }`}
                    >
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className={`w-10 h-10 rounded-full object-cover bg-white dark:bg-[#111111] ${hasStories ? "border-2 border-white dark:border-[#111111]" : "border border-zinc-200 dark:border-zinc-700"}`}
                      />
                    </div>
                  );
                })()}
                <div>
                  <span className="font-bold text-[#2d1c1c] dark:text-white mr-2">{post.username || post.User?.username || "user"}</span>
                  <span className="text-[#4f3c3c] dark:text-gray-300">{post.caption || "Just enjoying the vibes! ✨📷"}</span>
                  {post.tags && post.tags.length > 0 && (
                    <div className="text-[#0095f6] text-sm mt-1">
                      {post.tags.map(t => `#${t}`).join(" ")}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">JUST NOW</div>
                </div>
              </div>
            )}


          </div>

          {/* ACTIONS & FOOTER */}
          <div className="border-t border-[#eadcdc] dark:border-[#2c2c2c] p-4 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLikePost}
                  className={`transition hover:scale-110 ${post.isLiked ? "text-red-500" : "text-[#2d1c1c] dark:text-white hover:text-red-500"}`}
                >
                  <Heart size={26} fill={post.isLiked ? "currentColor" : "none"} />
                </button>
                <button className="text-[#2d1c1c] dark:text-white hover:text-gray-500 transition hover:scale-110">
                  <Send size={26} />
                </button>
              </div>
            </div>
            <div 
              className="font-bold text-[#2d1c1c] dark:text-white mb-1 transition-colors duration-300 cursor-pointer hover:underline"
              onClick={() => setShowLikersModal(true)}
            >
              {post.likes ?? post.likes_count ?? 0} likes
            </div>
            <div className="text-xs text-gray-500 mb-4">
              {post.createdAt ? (() => {
                const diff = Date.now() - new Date(post.createdAt).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 60) return `${mins} MINUTES AGO`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs} HOURS AGO`;
                const days = Math.floor(hrs / 24);
                return `${days} DAYS AGO`;
              })() : '1 DAY AGO'}
            </div>
          </div>
        </div>
      </div>
      
      {showLikersModal && (
        <LikersModal 
          postId={post.id} 
          isOpen={showLikersModal} 
          onClose={() => setShowLikersModal(false)} 
        />
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && authorStories.length > 0 && (
        <StoryViewerModal
          userStories={[{
            username: post.username || post.User?.username || "user",
            full_name: post.username || post.User?.username || "User",
            avatar: post.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
            stories: authorStories
          }]}
          initialUserIndex={0}
          initialStoryIndex={0}
          onClose={() => setShowStoryViewer(false)}
          onStoryViewed={(storyId) => {
            setAuthorStories(prev => prev.map(s => s.id === storyId ? { ...s, is_viewed: true } : s));
          }}
        />
      )}
    </div>
  );
}

export default PostModal;
