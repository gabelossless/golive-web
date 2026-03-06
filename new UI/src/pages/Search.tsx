import { useSearchParams, Link } from "react-router-dom";
import { MOCK_VIDEOS } from "../constants";
import { Filter, CheckCircle2, MoreVertical } from "lucide-react";
import { motion } from "motion/react";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const results = MOCK_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.creator.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Search results for "{query}"</h2>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="space-y-6">
        {results.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col sm:flex-row gap-4 group cursor-pointer"
          >
            <Link to={`/watch/${video.id}`} className="relative flex-shrink-0 w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-white/5">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {video.duration}
              </div>
              {video.isLive && (
                <div className="absolute top-2 left-2 live-badge">Live</div>
              )}
            </Link>

            <div className="flex flex-col flex-1 min-w-0 py-1">
              <div className="flex justify-between gap-2">
                <Link to={`/watch/${video.id}`}>
                  <h3 className="text-lg font-bold line-clamp-2 group-hover:text-[#9147ff] transition-colors">
                    {video.title}
                  </h3>
                </Link>
                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full h-fit">
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <div className="text-xs text-gray-400 mt-1">
                {video.views} views • {video.uploadedAt}
              </div>

              <Link 
                to={`/channel/${video.creator.id}`}
                className="flex items-center gap-2 my-3 hover:text-white transition-colors"
              >
                <img
                  src={video.creator.avatar}
                  alt={video.creator.name}
                  className="w-6 h-6 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {video.creator.name}
                  <CheckCircle2 size={12} className="text-gray-500" />
                </span>
              </Link>

              <p className="text-xs text-gray-400 line-clamp-2">
                {video.description}
              </p>

              {video.isLive && (
                <div className="mt-2">
                  <span className="text-[10px] bg-red-600/20 text-red-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    New Live
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p>No results found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
