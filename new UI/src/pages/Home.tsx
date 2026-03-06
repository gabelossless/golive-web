import CategoryBar from "../components/CategoryBar";
import VideoCard from "../components/VideoCard";
import { MOCK_VIDEOS } from "../constants";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      <CategoryBar />
      
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {MOCK_VIDEOS.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <VideoCard video={video} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
