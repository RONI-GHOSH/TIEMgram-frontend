import React, { useState } from "react";
import { X, Camera, MapPin, Tag, Globe, Lock } from "lucide-react";
import { useDropzone } from "react-dropzone";

function CreatePostModal({ onClose, onSuccess }) {
  const [uploadMedia, setUploadMedia] = useState([]);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadType, setUploadType] = useState("image"); // "image" | "video" | "text"
  const [isPublicPost, setIsPublicPost] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [textPostBg, setTextPostBg] = useState("bg-zinc-900");

  const TEXT_BACKGROUNDS = [
    "bg-zinc-900",
    "bg-gradient-to-r from-purple-600 to-indigo-600",
    "bg-gradient-to-r from-red-500 to-orange-500",
    "bg-gradient-to-r from-blue-500 to-teal-500",
    "bg-gradient-to-r from-pink-500 to-rose-500",
  ];

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadMedia(prev => [...prev, ...acceptedFiles]);
      const firstFile = acceptedFiles[0];
      if (firstFile.type.startsWith("video/")) {
        setUploadType("video");
      } else {
        setUploadType("image");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'image/*': [],
      'video/*': []
    },
    multiple: true
  });

  const handleCreatePost = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("No access token found. Please login.");
      return;
    }

    setIsCreatingPost(true);

    try {
      const formData = new FormData();
      formData.append("caption", uploadCaption);
      formData.append("type", uploadType);
      formData.append("location", uploadLocation);
      formData.append("is_public", String(isPublicPost));

      if (uploadTags.trim()) {
        const parsedTags = uploadTags.split(",").map(t => t.trim()).filter(Boolean);
        formData.append("tags", JSON.stringify(parsedTags));
      } else {
        formData.append("tags", JSON.stringify([]));
      }

      if (uploadType !== "text") {
        uploadMedia.forEach(file => {
          formData.append("media", file);
        });
      }

      setUploadProgress(0);

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://tiem.digitaligrow.com/api/v1/posts", true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve({ ok: true, json: () => Promise.resolve(JSON.parse(xhr.responseText)) });
            } catch (e) {
              resolve({ ok: false, json: () => Promise.resolve({ success: false, message: "Invalid JSON response" }) });
            }
          } else {
            try {
              resolve({ ok: false, json: () => Promise.resolve(JSON.parse(xhr.responseText)) });
            } catch (e) {
              resolve({ ok: false, json: () => Promise.resolve({ success: false, message: "Upload failed" }) });
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network Error"));
        };

        xhr.send(formData);
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        const createdData = resJson.data;
        
        let myUser = null;
        try {
          myUser = JSON.parse(localStorage.getItem("user"));
        } catch (e) {}

        // Return standard structure matching the feeds
        const newPostItem = {
          id: createdData.id || Date.now(),
          username: createdData.user?.username || myUser?.username || "me",
          full_name: createdData.user?.full_name || myUser?.full_name || "Me",
          avatar: createdData.user?.avatar_url || myUser?.avatar_url || "",
          image: createdData.PostMedia?.[0]?.url || (uploadType === "text" ? "" : (uploadMedia[0] ? URL.createObjectURL(uploadMedia[0]) : "")),
          likes: "0",
          comments: "0",
          caption: createdData.caption,
          type: createdData.type,
          isTextPost: createdData.type === "text",
          textBg: textPostBg,
          location: createdData.location,
          tags: createdData.tags || [],
          is_public: createdData.is_public
        };

        if (onSuccess) {
          onSuccess(newPostItem);
        }
        onClose();
      } else {
        alert(resJson.message || "Failed to create post.");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      alert(`An error occurred while creating your post: ${err.message || err}`);
    } finally {
      setIsCreatingPost(false);
      setUploadProgress(0);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-900 max-h-[90vh] animate-[scaleIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-900 flex items-center justify-between bg-white dark:bg-zinc-950">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create new post</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Post Type Selector Tabs - INSTAGRAM STYLE */}
          <div className="flex border-b border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setUploadType("image")}
              className={`flex-1 pb-3 text-sm font-semibold transition ${
                uploadType !== "text"
                  ? "border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
              }`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setUploadType("text")}
              className={`flex-1 pb-3 text-sm font-semibold transition ${
                uploadType === "text"
                  ? "border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
              }`}
            >
              Text
            </button>
          </div>

          {uploadType === "text" ? (
            /* TEXT POST CREATION SCREEN */
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Choose canvas background</label>
              <div className="flex gap-2.5 flex-wrap">
                {TEXT_BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTextPostBg(bg)}
                    className={`w-9 h-9 rounded-full transition-all ${bg} ${
                      textPostBg === bg ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-105" : "hover:scale-105 border border-black/5"
                    }`}
                  />
                ))}
              </div>

              {/* Canvas Preview */}
              <div className={`w-full aspect-[16/10] rounded-xl flex items-center justify-center p-6 text-center text-white font-bold text-xl relative transition duration-305 ${textPostBg}`}>
                <textarea
                  placeholder="What is on your mind? Type here..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full bg-transparent border-none outline-none resize-none text-center placeholder-white/60 text-white focus:ring-0 text-lg font-bold leading-relaxed max-h-[180px]"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            /* MEDIA UPLOAD SCREEN */
            <div className="space-y-5">
              <div 
                {...getRootProps()} 
                className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  isDragActive 
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                <input {...getInputProps()} />
                <Camera size={44} className={`mx-auto mb-3 transition ${isDragActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"}`} strokeWidth={1.5} />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-350">
                  {isDragActive ? "Drop the files here" : "Drag photos and videos here"}
                </p>
                <button type="button" className="mt-4 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold py-2 px-4 rounded-lg transition">
                  Select from computer
                </button>
              </div>

              {/* Previews Grid */}
              {uploadMedia.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5 mt-2">
                  {uploadMedia.map((file, idx) => {
                    const fileUrl = URL.createObjectURL(file);
                    const isVideo = file.type.startsWith("video/");
                    return (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                        {isVideo ? (
                          <video src={fileUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={fileUrl} className="w-full h-full object-cover" alt="" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadMedia(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center text-xs transition"
                        >
                          &times;
                        </button>
                        {isVideo && (
                          <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 px-1 rounded text-white font-bold">
                            VIDEO
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Caption Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Caption</label>
                <textarea
                  placeholder="Write a caption..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 outline-none focus:border-zinc-450 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Add location (e.g. Campus)"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 pl-10 pr-4 py-2.5 outline-none focus:border-zinc-400 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition text-sm"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tags (comma separated)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="fun, lifestyle"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 pl-10 pr-4 py-2.5 outline-none focus:border-zinc-400 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition text-sm"
                />
              </div>
            </div>
          </div>

          {/* Public Toggle Switch */}
          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              {isPublicPost ? <Globe className="text-zinc-500" size={18} /> : <Lock className="text-zinc-500" size={18} />}
              <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Public Post</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Anyone on TIEMgram can see this post</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublicPost(!isPublicPost)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                isPublicPost ? "bg-[#0095f6]" : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-sm transition duration-200 transform ${
                isPublicPost ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold transition text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreatePost}
            disabled={isCreatingPost || (uploadType !== "text" && uploadMedia.length === 0) || (uploadType === "text" && !uploadCaption.trim())}
            className="flex-1 py-3 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold shadow-sm disabled:opacity-50 disabled:pointer-events-none transition text-sm flex items-center justify-center relative overflow-hidden"
          >
            {isCreatingPost ? (
              <>
                <div className="absolute left-0 top-0 bottom-0 bg-[#005c9e] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                <div className="relative z-10 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing... {uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : ''}
                </div>
              </>
            ) : "Share"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreatePostModal;
