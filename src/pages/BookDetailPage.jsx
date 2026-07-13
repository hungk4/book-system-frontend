import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  BookOpen,
  Heart,
  Share2,
  ChevronRight,
  Eye,
  List,
  Clock,
  Calendar,
  AlertCircle,
  Loader,
  Star,
  MessageSquare
} from "lucide-react";
import { toast } from "react-toastify";

const BookDetailPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [categorieName, setCategorieName] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/books/${id}`);

        setBook(response.data.book);
        setRelatedBooks(response.data.relatedBooks || []);
        setCategorieName(response.data.book.category_name || "Không xác định");
        setIsFavorite(response.data.favoriteStatus);

        // Fetch reviews
        const reviewRes = await axiosClient.get(`/books/${id}/reviews`);
        setReviews(reviewRes.data.reviews || []);
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Không thể tải thông tin sách.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBookDetail();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Vui lòng đăng nhập để đánh giá sách");
      return;
    }
    
    if (reviewContent.trim().length < 50) {
      toast.warning("Đánh giá phải dài ít nhất 50 ký tự");
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await axiosClient.post(`/books/${id}/reviews`, {
        rating: reviewRating,
        content: reviewContent
      });
      
      toast.success(res.data.message);
      // Thêm review mới vào danh sách
      setReviews([res.data.review, ...reviews]);
      setReviewContent("");
      setReviewRating(5);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReadNow = () => {
    // Chuyển hướng đến trang đọc sách
    navigate(`/read/${id}`);
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    try {
      await axiosClient.post(`/books/${id}/toggle-favorite`);
      toast.success(
        isFavorite ? "Đã bỏ yêu thích sách." : "Đã thêm sách vào yêu thích.",
        {
          autoClose: 3000,
        },
      );
      setIsFavorite((prev) => !prev);
    } catch (err) {
      console.error("Lỗi khi cập nhật yêu thích:", err);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
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
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Không tìm thấy sách
        </h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  // Fallback nếu không có ảnh
  const coverImage =
    book.cover_url || "https://placehold.co/400x600?text=No+Cover";

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-12 font-sans">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>
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
            {/* Left: Book Cover  */}
            <div className="md:w-1/3 lg:w-1/4 relative bg-gray-200 dark:bg-slate-900 flex justify-center items-center p-6 md:p-8">
              {/* Background Blur Image  */}
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
                    Tác giả:{" "}
                    <span className="text-blue-600 font-semibold text-base">
                      {book.author_name || "Đang cập nhật"}
                    </span>
                  </span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <List size={16} /> Thể loại: {categorieName}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-blue-500" />
                  <span>{book.read_count || 0} Lượt đọc</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-red-500" />
                  <span>{book.favorite_count || 0} Yêu thích</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-green-500" />
                  <span>Phát hành: {new Date(book.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  <span>Năm: {new Date(book.created_at).getFullYear()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8 flex-grow">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen size={18} /> Giới thiệu sách
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
                      ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10"
                      : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "Đã Thích" : "Yêu Thích"}
                </button>

                {/* <button className="sm:w-12 px-0 py-3 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center justify-center">
                  <Share2 size={20} />
                </button> */}
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
                  book.description.split("\n").map((paragraph, idx) => (
                    <p key={idx} className="mb-4">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p>Đang cập nhật...</p>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" />
                Đánh giá & Bình luận
              </h3>

              {/* Form viết đánh giá */}
              <div className="mb-8 bg-blue-50/50 dark:bg-slate-700/30 p-5 rounded-xl border border-blue-100 dark:border-slate-700">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Viết đánh giá của bạn (nhận +30 Điểm thưởng)</h4>
                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star size={24} fill={star <= reviewRating ? "#f59e0b" : "none"} className={star <= reviewRating ? "text-amber-500" : "text-gray-300 dark:text-gray-600"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  rows="3"
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này (ít nhất 50 ký tự)..."
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mb-3 resize-none"
                ></textarea>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${reviewContent.length >= 50 ? 'text-green-500' : 'text-gray-500'}`}>
                    {reviewContent.length}/50 ký tự
                  </span>
                  <button 
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-2 disabled:bg-gray-400"
                  >
                    {submittingReview ? <Loader size={18} className="animate-spin" /> : 'Gửi đánh giá'}
                  </button>
                </div>
              </div>

              {/* Danh sách Review */}
              <div className="space-y-5">
                {reviews.length > 0 ? reviews.map(rev => (
                  <div key={rev.id} className="border-b border-gray-100 dark:border-slate-700 pb-5 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                          {rev.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{rev.username}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex gap-1 mb-2 ml-10">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={14} fill={star <= rev.rating ? "#f59e0b" : "none"} className={star <= rev.rating ? "text-amber-500" : "text-gray-300"} />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm ml-10 leading-relaxed whitespace-pre-line">
                      {rev.content}
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                    Chưa có đánh giá nào. Hãy là người đầu tiên review cuốn sách này!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Sách cùng tác giả
              </h3>
              <div className="space-y-4">
                {relatedBooks.length > 0 ? relatedBooks.map((relatedBook) => (
                  <Link to={`/book/${relatedBook.id}`} key={relatedBook.id} className="flex gap-3 group cursor-pointer">
                    <div className="w-16 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={relatedBook.cover_url || `https://placehold.co/100x150?text=No+Cover`}
                        alt={relatedBook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition line-clamp-2">
                        {relatedBook.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Eye size={12} /> {relatedBook.read_count || 0} lượt đọc
                      </p>
                    </div>
                  </Link>
                )) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">Không có sách nào khác cùng tác giả.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
