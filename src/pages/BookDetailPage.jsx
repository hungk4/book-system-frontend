import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  BookOpen, Heart, Share2, ChevronRight, 
  Eye, List, Clock, Calendar, AlertCircle, Loader 
} from 'lucide-react';

const BookDetailPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const navigate = useNavigate()

  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/books/${id}`);
        setBook(response.book);
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Không thể tải thông tin sách.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBookDetail();
  }, [id]);

  const handleReadNow = () => {
    // Chuyển hướng đến trang đọc sách
    navigate(`/read/${id}`);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Gọi API thêm/xóa khỏi thư viện yêu thích
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500">Đang tải dữ liệu sách...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy sách</h2>
        <Link to="/" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  // Fallback nếu không có ảnh
  const coverImage = book.cover_image_key || "https://placehold.co/400x600?text=No+Cover";

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-12 font-sans">
      
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="truncate font-medium text-gray-900 dark:text-white max-w-[200px] sm:max-w-md">
              {book.title}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Top Section: Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="md:flex">
            {/* Left: Book Cover (Blur Background Effect) */}
            <div className="md:w-1/3 lg:w-1/4 relative bg-gray-200 dark:bg-slate-900 flex justify-center items-center p-6 md:p-8">
                {/* Background Blur Image (Optional aesthetic) */}
                <div 
                  className="absolute inset-0 opacity-20 blur-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverImage})` }}
                ></div>
                
                {/* Main Image */}
                <div className="relative z-10 w-48 md:w-full max-w-55 shadow-2xl rounded-lg overflow-hidden transition-transform hover:scale-105 duration-300">
                  <img 
                    src={coverImage} 
                    alt={book.title} 
                    className="w-full h-auto object-cover aspect-2/3"
                  />
                </div>
            </div>

            {/* Right: Details */}
            <div className="md:w-2/3 lg:w-3/4 p-6 md:p-8 flex flex-col">
              <div className="mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {book.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    Tác giả: <span className="text-blue-600 font-semibold text-base">{book.author || "Đang cập nhật"}</span>
                  </span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <List size={16} /> Thể loại: {book.category || "Văn học"}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-blue-500" />
                  <span>12.5k Lượt đọc</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-red-500" />
                  <span>856 Yêu thích</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-green-500" />
                  <span>Cập nhật: 2 ngày trước</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  <span>Năm: {book.publish_year || 2024}</span>
                </div>
              </div>

              {/* Description (Truncated) */}
              <div className="mb-8 flex-grow">
                 <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <BookOpen size={18} /> Tóm tắt nội dung
                 </h3>
                 <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4 md:line-clamp-6">
                   {book.description || "Nội dung đang được cập nhật..."}
                 </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <button 
                  onClick={handleReadNow}
                  className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={22} />
                  Đọc Ngay
                </button>
                
                <button 
                  onClick={toggleFavorite}
                  className={`flex-1 sm:flex-none px-6 py-3 border-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    isFavorite 
                      ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10' 
                      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                  {isFavorite ? "Đã Thích" : "Yêu Thích"}
                </button>

                <button className="sm:w-12 px-0 py-3 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center justify-center">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Tabs/Chapters/Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                Giới thiệu chi tiết
              </h3>
              <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                 {book.description ? (
                   book.description.split('\n').map((paragraph, idx) => (
                     <p key={idx} className="mb-4">{paragraph}</p>
                   ))
                 ) : (
                   <p>Đang cập nhật...</p>
                 )}
              </div>
            </div>

            {/* Placeholder for Comments */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bình luận</h3>
               <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                  Chức năng bình luận đang được phát triển.
               </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sách cùng tác giả</h3>
                {/* Mock List */}
                <div className="space-y-4">
                   {[1, 2, 3].map((item) => (
                      <div key={item} className="flex gap-3 group cursor-pointer">
                         <div className="w-16 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <img src={`https://placehold.co/100x150?text=Book+${item}`} alt="" className="w-full h-full object-cover"/>
                         </div>
                         <div>
                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition line-clamp-2">Sách tham khảo {item}</h4>
                            <p className="text-xs text-gray-500 mt-1">Lượt xem: 2.3k</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;