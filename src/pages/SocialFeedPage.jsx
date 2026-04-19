import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Send, Trophy, Zap, Watch, FlaskConical, Salad, Flame, Target,
  TrendingUp, Award, ChevronRight, Crown, Star, Plus, X, Smile,
  Shield, Brain, Moon, Activity, Users, Camera, ImageIcon, Loader2
} from "lucide-react";

/* ─── constants ─── */
const TYPE_META = {
  achievement:      { icon: Award,       color: "#F59E0B", gradient: "from-amber-500/20 to-amber-600/5",  label: "Achievement" },
  milestone:        { icon: Trophy,    color: "#A855F7", gradient: "from-purple-500/20 to-purple-600/5", label: "Milestone" },
  challenge_join:   { icon: Target,      color: "#0EA5E9", gradient: "from-sky-500/20 to-sky-600/5",      label: "Challenge Joined" },
  challenge_complete:{ icon: Trophy,     color: "#F59E0B", gradient: "from-amber-500/20 to-amber-600/5",  label: "Challenge Complete" },
  hps_update:       { icon: Zap,         color: "#7B35D8", gradient: "from-violet-500/20 to-violet-600/5", label: "HPS Update" },
  wearable_sync:    { icon: Watch,       color: "#10B981", gradient: "from-emerald-500/20 to-emerald-600/5",label: "Sync" },
  post:             { icon: MessageCircle,color: "#7B35D8", gradient: "from-violet-500/20 to-violet-600/5",label: "Post" },
  lab_upload:       { icon: FlaskConical, color: "#EF4444", gradient: "from-red-500/20 to-red-600/5",     label: "Lab Upload" },
  nutrition_log:    { icon: Salad,       color: "#F59E0B", gradient: "from-amber-500/20 to-amber-600/5",  label: "Nutrition" },
  streak:           { icon: Flame,       color: "#EF4444", gradient: "from-red-500/20 to-red-600/5",      label: "Streak" },
  daily_challenge:  { icon: Star,        color: "#0EA5E9", gradient: "from-sky-500/20 to-sky-600/5",      label: "Daily Challenge" },
  appointment:      { icon: Activity,    color: "#10B981", gradient: "from-emerald-500/20 to-emerald-600/5",label: "Appointment" },
  refill:           { icon: Shield,      color: "#6366F1", gradient: "from-indigo-500/20 to-indigo-600/5",label: "Refill" },
  sos:              { icon: Zap,         color: "#EF4444", gradient: "from-red-500/20 to-red-600/5",      label: "Alert" },
};

const MOODS = [
  { emoji: "💪", label: "Feeling Strong", type: "post" },
  { emoji: "🏆", label: "Health Win", type: "achievement" },
  { emoji: "🔥", label: "On Fire", type: "streak" },
  { emoji: "🧘", label: "Mindful Moment", type: "post" },
  { emoji: "🥗", label: "Clean Eating", type: "nutrition_log" },
  { emoji: "⚡", label: "New Energy", type: "milestone" },
];

const AVATAR_COLORS = [
  "from-violet-500 to-fuchsia-500", "from-cyan-500 to-blue-500", "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500", "from-rose-500 to-pink-500", "from-indigo-500 to-purple-500",
  "from-lime-500 to-green-500", "from-sky-500 to-indigo-500",
];

function getAvatarColor(name) {
  const safeName = name || "A";  // ← use safeName everywhere below
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) 
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % safeName.length];
}

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return `${Math.floor(d / 604800)}w`;
}

function formatContent(content) {
  if (!content) return "";
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-stellar font-semibold">$1</strong>')
    .replace(/(#\w+)/g, '<span class="text-cosmic cursor-pointer hover:underline">$1</span>');
}

/* ─── Story Bubble ─── */
function StoryBubble({ highlight, onClick }) {
  const grad = getAvatarColor(highlight.name);
  const tierColors = { CENTENARIAN: "ring-amber-400", MASTERY: "ring-violet-400", RESILIENCE: "ring-emerald-400", LONGEVITY: "ring-indigo-400" };
  const ringColor = tierColors[highlight.tier] || "ring-cosmic/60";

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 min-w-[72px] group" data-testid={`story-${highlight.user_id}`}>
      <div className={`w-[62px] h-[62px] rounded-full ring-2 ${ringColor} p-[2px] group-hover:ring-cosmic transition-all duration-300 group-hover:scale-105`}>
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
          <span className="text-white font-display font-bold text-lg">{highlight.initial}</span>
        </div>
      </div>
      <span className="text-[10px] text-stellar-dim font-mono truncate max-w-[72px] group-hover:text-stellar transition-colors">
        {highlight.name?.split(" ")[0]}
      </span>
    </button>
  );
}

/* ─── Feed Card ─── */
function FeedCard({ item, currentUserId, onLike, onComment, style }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(item.user_liked || false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [animateLike, setAnimateLike] = useState(false);
  const [comments, setComments] = useState(item.comments || []);

  const meta = TYPE_META[item.type] || TYPE_META.post;
  const Icon = meta.icon;
  const avatarGrad = getAvatarColor(item.user_name);
  const isOwn = item.user_id === currentUserId;

  const handleLike = async () => {
    setAnimateLike(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    setTimeout(() => setAnimateLike(false), 600);
    try { await onLike(item.id); } catch { setLiked(!newLiked); setLikeCount(prev => newLiked ? prev - 1 : prev + 1); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await onComment(item.id, commentText);
      setComments(prev => [...prev, res]);
      setCommentText("");
    } catch { toast.error("Failed to comment"); }
  };

  const isSpecial = ["achievement", "milestone", "challenge_complete", "hps_update"].includes(item.type);

  return (
    <div
      className={`rounded-xl border transition-all duration-500 hover:border-white/10 ${
        isSpecial ? `border-[${meta.color}]/20 bg-gradient-to-b ${meta.gradient} backdrop-blur-sm` : "border-white/5 bg-white/[0.02] backdrop-blur-sm"
      }`}
      style={style}
      data-testid={`feed-item-${item.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center ring-2 ring-white/10 shrink-0`}>
          <span className="text-white font-display font-bold text-sm">{item.user_avatar_initial || item.user_name?.[0] || "A"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-stellar truncate">{item.user_name}</span>
            {isOwn && <span className="text-[9px] font-mono text-cosmic bg-cosmic/10 px-1.5 py-0.5 rounded-full border border-cosmic/20">you</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {item.user_franchise && (
              <span className="text-[10px] font-mono text-stellar-dim truncate">{item.user_franchise}</span>
            )}
            <span className="text-stellar-dim/40">·</span>
            <span className="text-[10px] font-mono text-stellar-dim">{timeAgo(item.timestamp)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}>
          <Icon size={12} style={{ color: meta.color }} />
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-stellar/90 text-[14px] font-body leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(item.content) }} />
      </div>

      {/* Photo (download-protected) */}
      {item.photo_id && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/5 relative group">
          <img
            src={`${api.defaults.baseURL}/feed/photo/${item.photo_id}`}
            alt="Post photo"
            className="w-full max-h-[400px] object-cover select-none"
            draggable="false"
            onContextMenu={e => e.preventDefault()}
            style={{ pointerEvents: "none" }}
            data-testid={`feed-photo-${item.id}`}
          />
          {/* Transparent overlay to block right-click/drag on the image */}
          <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} style={{ userSelect: "none" }} />
        </div>
      )}

      {/* Special banner for milestones */}
      {isSpecial && (
        <div className="mx-4 mb-3 rounded-lg py-2 px-3 flex items-center gap-2" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}15` }}>
          <Trophy size={14} style={{ color: meta.color }} />
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: meta.color }}>
            {item.type === "hps_update" ? "Score Update" : item.type === "challenge_complete" ? "Challenge Conquered" : "Achievement Unlocked"}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-2 flex items-center gap-1 border-t border-white/5 pt-2">
        <button
          data-testid={`like-${item.id}`}
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
            liked ? "bg-red-500/10 text-red-400" : "text-stellar-dim hover:text-red-400 hover:bg-red-500/5"
          }`}
        >
          <Heart
            size={16}
            className={`transition-all duration-300 ${animateLike ? "scale-125" : "scale-100"}`}
            fill={liked ? "currentColor" : "none"}
          />
          <span className="text-xs font-mono">{likeCount > 0 ? likeCount : ""}</span>
        </button>

        <button
          data-testid={`comment-toggle-${item.id}`}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stellar-dim hover:text-cosmic hover:bg-cosmic/5 transition-all duration-300"
        >
          <MessageCircle size={16} />
          <span className="text-xs font-mono">{comments.length > 0 ? comments.length : ""}</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stellar-dim hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-300 ml-auto">
          <Send size={14} />
          <span className="text-[10px] font-mono">Share</span>
        </button>
      </div>

      {/* Like summary */}
      {likeCount > 0 && (
        <div className="px-4 pb-2">
          <span className="text-[11px] font-body text-stellar-dim">
            {liked && likeCount === 1 ? "You liked this" : liked ? `You and ${likeCount - 1} other${likeCount - 1 > 1 ? "s" : ""}` : `${likeCount} like${likeCount > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-3 border-t border-white/5 pt-2 space-y-2">
          {comments.slice(-3).map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(c?.user_name)} flex items-center justify-center shrink-0`}>
                <span className="text-white text-[9px] font-bold">{c.user_name?.[0] || "A"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-body">
                  <strong className="text-stellar">{c.user_name}</strong>{" "}
                  <span className="text-stellar/70">{c.text}</span>
                </span>
                <span className="text-[9px] font-mono text-stellar-dim ml-2">{timeAgo(c.timestamp)}</span>
              </div>
            </div>
          ))}
          {comments.length > 3 && (
            <button className="text-[11px] font-mono text-cosmic hover:underline">View all {comments.length} comments</button>
          )}
          <div className="flex items-center gap-2 pt-1">
            <input
              data-testid={`comment-input-${item.id}`}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-stellar text-[12px] font-body placeholder:text-stellar-dim/40 outline-none border-b border-white/5 pb-1 focus:border-cosmic/30 transition-colors"
            />
            {commentText.trim() && (
              <button data-testid={`comment-send-${item.id}`} onClick={handleComment} className="text-cosmic hover:text-cosmic-light transition-colors">
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Compose Modal ─── */
function ComposeModal({ user, onClose, onPost }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);
  const [posting, setPosting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; };
const handlePost = async () => {
  if (!text.trim() && !photo) return;
  setPosting(true);
  try {
    let photoId = null;
    if (photo) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", photo);

      const token = localStorage.getItem("agereboot_token");
      const res = await fetch(
        `https://app.agereboot.life/api/feed/upload-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const uploadData = await res.json();
      photoId = uploadData.photo_id;
      setUploading(false);
    }

    await onPost(text, mood?.type || "post", photoId);
    onClose();
  } catch (err) {
    toast.error(err.message || err.response?.data?.detail || "Failed to post");
  } finally {
    setPosting(false);
    setUploading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-[#0D0821]/95 backdrop-blur-xl shadow-2xl shadow-cosmic/10 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={onClose} className="text-stellar-dim hover:text-stellar transition-colors"><X size={20} /></button>
          <span className="font-display text-sm font-bold text-stellar tracking-wider uppercase">New Post</span>
          <Button
            data-testid="compose-post-btn"
            onClick={handlePost}
            disabled={posting || (!text.trim() && !photo)}
            size="sm"
            className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-5 rounded-full border border-cosmic-light/30 disabled:opacity-40"
          >
            {uploading ? <><Loader2 size={12} className="animate-spin mr-1" /> Uploading...</> : posting ? "Posting..." : "Share"}
          </Button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center ring-2 ring-white/10 shrink-0`}>
              <span className="text-white font-display font-bold text-sm">{user?.name?.[0] || "A"}</span>
            </div>
            <div className="flex-1">
              <span className="font-body text-sm font-semibold text-stellar">{user?.name}</span>
              {mood && (
                <span className="ml-2 text-xs text-stellar-dim">
                  {mood.emoji} {mood.label}
                </span>
              )}
              <textarea
                ref={inputRef}
                data-testid="compose-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's your health win today?"
                className="w-full mt-2 bg-transparent text-stellar text-[15px] font-body placeholder:text-stellar-dim/30 outline-none resize-none min-h-[80px] leading-relaxed"
                maxLength={500}
              />
            </div>
          </div>

          {/* Photo Preview */}
          {photoPreview && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10">
              <img src={photoPreview} alt="Preview" className="w-full max-h-[250px] object-cover" />
              <button
                onClick={removePhoto}
                data-testid="remove-photo-btn"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom bar: photo + mood + counter */}
        <div className="px-4 pb-4">
          {/* Photo upload button */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" data-testid="photo-file-input" />
            <button
              data-testid="add-photo-btn"
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200 border ${
                photo
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-cosmic/20 hover:text-cosmic"
              }`}
            >
              <Camera size={14} />
              <span>{photo ? "Photo added" : "Add Photo"}</span>
            </button>
            {photo && (
              <span className="text-[9px] font-mono text-stellar-dim">
                {(photo.size / 1024).toFixed(0)}KB · {photo.type.split("/")[1].toUpperCase()}
              </span>
            )}
          </div>

          {/* Mood selector */}
          <div className="flex items-center gap-1.5 mb-2">
            <Smile size={12} className="text-stellar-dim" />
            <span className="text-[10px] font-mono text-stellar-dim uppercase tracking-wider">Mood</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button
                key={m.label}
                onClick={() => setMood(mood?.label === m.label ? null : m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200 border ${
                  mood?.label === m.label
                    ? "bg-cosmic/15 border-cosmic/40 text-cosmic"
                    : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/10 hover:text-stellar"
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] font-mono text-stellar-dim">{text.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Trending Widget ─── */
function TrendingWidget({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4" data-testid="trending-widget">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-cosmic" />
        <span className="font-display text-xs font-bold text-stellar uppercase tracking-wider">Top Performers</span>
      </div>
      <div className="space-y-3">
        {leaderboard.slice(0, 5).map((p, i) => (
          <div key={i} className="flex items-center gap-3 group">
            <span className={`w-5 text-right font-mono text-xs font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-stellar-dim"}`}>
              {i === 0 ? <Crown size={14} className="text-amber-400 inline" /> : `#${i + 1}`}
            </span>
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(p?.name)} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{p.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-body font-medium text-stellar truncate group-hover:text-cosmic transition-colors">{p.name}</div>
              <div className="text-[9px] font-mono text-stellar-dim">{p.franchise}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-display font-bold text-cosmic">{p.hps_final}</div>
              <div className="text-[8px] font-mono text-stellar-dim uppercase">HPS</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── This Week Stats ─── */
function WeekStatsWidget({ stats }) {
  if (!stats) return null;
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4" data-testid="week-stats-widget">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-emerald-400" />
        <span className="font-display text-xs font-bold text-stellar uppercase tracking-wider">This Week</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-lg font-display font-bold text-cosmic">{stats.streak_days || 0}</div>
          <div className="text-[9px] font-mono text-stellar-dim uppercase">Day Streak</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-lg font-display font-bold text-amber-400">{stats.weekly_credits || 0}</div>
          <div className="text-[9px] font-mono text-stellar-dim uppercase">Credits</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-lg font-display font-bold text-emerald-400">{stats.total_active_challenges || 0}</div>
          <div className="text-[9px] font-mono text-stellar-dim uppercase">Challenges</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-lg font-display font-bold text-rose-400">{stats.monthly_badges_count || 0}</div>
          <div className="text-[9px] font-mono text-stellar-dim uppercase">Badges</div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function SocialFeedPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [feedRes, hlRes, lbRes, statsRes] = await Promise.all([
        api.get("/feed"),
        api.get("/feed/highlights").catch(() => ({ data: { highlights: [] } })),
        api.get("/leaderboard").catch(() => ({ data: { leaderboard: [] } })),
        api.get("/employee/dashboard-stats").catch(() => ({ data: {} })),
      ]);
      setFeed(feedRes.data?.feed || []);
      setHighlights(hlRes.data?.highlights || []);
      setLeaderboard(lbRes.data?.leaderboard || []);
      setDashStats(statsRes.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePost = async (text, type, photoId) => {
    await api.post("/feed/post", { content: text, post_type: type, photo_id: photoId || null });
    toast.success("Shared with the community!");
    const res = await api.get("/feed");
    setFeed(res.data?.feed || []);
  };

  const handleLike = async (id) => {
    await api.post(`/feed/${id}/like`);
  };

  const handleComment = async (id, text) => {
    const res = await api.post(`/feed/${id}/comment`, { text });
    return res.data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-mono text-xs text-stellar-dim tracking-wider uppercase">Loading Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up" data-testid="social-feed-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Community <span className="text-cosmic">Feed</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Inspire · Celebrate · Compete
          </p>
        </div>
        <Button
          data-testid="new-post-btn"
          onClick={() => setShowCompose(true)}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-5 rounded-full border border-cosmic-light/30 shadow-[0_0_20px_rgba(123,53,216,0.25)] hover:shadow-[0_0_30px_rgba(123,53,216,0.4)] transition-all duration-300"
        >
          <Plus size={16} className="mr-1" /> New Post
        </Button>
      </div>

      {/* Stories / Highlights Bar */}
      {highlights.length > 0 && (
        <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4" data-testid="highlights-bar">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={12} className="text-amber-400" />
            <span className="font-display text-[10px] font-bold text-stellar uppercase tracking-[0.15em]">This Week's Stars</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
            {highlights.map((h, i) => (
              <StoryBubble key={i} highlight={h} onClick={() => toast.info(`${h.name}: ${h.subtitle}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Main Layout: Feed + Sidebar */}
      <div className="flex gap-6">
        {/* Feed Column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Quick Compose Bar */}
          <div
            onClick={() => setShowCompose(true)}
            className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 flex items-center gap-3 cursor-pointer hover:border-cosmic/20 transition-all duration-300 group"
            data-testid="quick-compose"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center ring-2 ring-white/10 shrink-0`}>
              <span className="text-white font-display font-bold text-sm">{user?.name?.[0] || "A"}</span>
            </div>
            <span className="text-stellar-dim/40 text-sm font-body group-hover:text-stellar-dim/60 transition-colors">
              What's your health win today, {user?.name?.split(" ")[0]}?
            </span>
          </div>

          {/* Feed Items */}
          {feed.map((item, i) => (
            <FeedCard
              key={item.id}
              item={item}
              currentUserId={user?.id}
              onLike={handleLike}
              onComment={handleComment}
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            />
          ))}

          {feed.length === 0 && (
            <div className="text-center py-16 rounded-xl border border-white/5 bg-white/[0.02]">
              <Users size={32} className="text-stellar-dim/30 mx-auto mb-3" />
              <p className="font-body text-sm text-stellar-dim">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>

        {/* Sidebar (desktop) */}
        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          <TrendingWidget leaderboard={leaderboard} />
          <WeekStatsWidget stats={dashStats} />

          {/* Motivational Quote */}
          <div className="rounded-xl border border-white/5 bg-gradient-to-b from-cosmic/5 to-transparent p-4">
            <div className="text-[11px] font-body text-stellar/70 italic leading-relaxed">
              "Take care of your body. It's the only place you have to live."
            </div>
            <div className="text-[9px] font-mono text-stellar-dim mt-2">— Jim Rohn</div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && <ComposeModal user={user} onClose={() => setShowCompose(false)} onPost={handlePost} />}
    </div>
  );
}
