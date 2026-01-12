import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, Eye, Heart } from "lucide-react";
import type { DetailedBlog } from "@/lib/constants/blog";
import { getCategoryLabel, getCategoryColorClass } from "@/lib/constants/blog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LandingBlogCardProps {
  blog: DetailedBlog;
}

export function LandingBlogCard({ blog }: LandingBlogCardProps) {
  const formatDate = (date: string) => {
    const now = new Date();
    const blogDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - blogDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

    return blogDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const categoryLabel = getCategoryLabel(blog.category);
  const categoryColor = getCategoryColorClass(blog.category);

  return (
    <Link href={`/blog/${blog.slug}`} className="group block h-full">
      <div className="glass-card animate-on-scroll h-full flex flex-col overflow-hidden">
        {blog.featured_image_url && (
          <div className="relative w-full" style={{ flexBasis: '50%' }}>
            <Image
              src={blog.featured_image_url}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
        
        <div className="p-6 flex-grow flex flex-col" style={{ flexBasis: '50%' }}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
              {categoryLabel}
            </span>
            {blog.read_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {blog.read_time_minutes} min read
              </span>
            )}
          </div>
          
          <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-gradient transition-colors duration-300 flex-grow">
            {blog.title}
          </h4>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 flex-grow">{blog.excerpt}</p>

          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={blog.author_avatar || undefined} alt={blog.author_name || ""} />
              <AvatarFallback>{blog.author_name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{blog.author_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(blog.published_at || blog.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500" />
              {blog.likes_count}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              {blog.comments_count}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-green-500" />
              {blog.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}