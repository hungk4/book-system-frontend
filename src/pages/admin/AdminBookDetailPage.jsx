import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Trash2,
  Star,
  MessageSquare,
  Calendar,
  User,
  BookOpen,
  Tag,
  Activity,
  Heart,
  Search,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const AdminBookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho filter và search client-side đối với review
  const [reviewSearch, setReviewSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookRes, reviewsRes] = await Promise.all([
        axiosClient.get(`/books/${id}`),
        axiosClient.get(`/books/${id}/reviews`),
      ]);

      setBook(bookRes.data.book);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error("Lỗi khi tải thông tin chi tiết sách:", error);
      toast.error("Không thể tải thông tin cuốn sách này");
      navigate("/admin/books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      try {
        await axiosClient.delete(`/reviews/${reviewId}`);
        toast.success("Xóa đánh giá thành công");
        // Cập nhật lại danh sách reviews
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch (error) {
        console.error("Lỗi khi xóa đánh giá:", error);
        toast.error(error.response?.data?.message || "Xóa đánh giá thất bại");
      }
    }
  };

  // Filter reviews client-side
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.username?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      review.content?.toLowerCase().includes(reviewSearch.toLowerCase());
    const matchesRating = ratingFilter ? review.rating === Number(ratingFilter) : true;
    return matchesSearch && matchesRating;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Không tìm thấy cuốn sách này</p>
        <button
          onClick={() => navigate("/admin/books")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Nút quay lại */}
      <div>
        <button
          onClick={() => navigate("/admin/books")}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách sách
        </button>
      </div>

      {/* Thông tin chi tiết sách */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Ảnh bìa */}
          <div className="w-full lg:w-48 flex-shrink-0">
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-64 object-cover rounded-lg border border-slate-100 shadow-md mx-auto lg:mx-0"
            />
          </div>

          {/* Chi tiết nội dung */}
          <div className="flex-grow space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100 uppercase">
                  ID: #{book.id}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase ${
                    book.is_premium
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}
                >
                  {book.is_premium ? "Premium" : "Free"}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                {book.title}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-t border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Tác giả</p>
                  <p className="text-sm font-bold text-slate-700">
                    {book.author_name || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                  <Tag size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Danh mục</p>
                  <p className="text-sm font-bold text-slate-700">
                    {book.category_name || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Số trang</p>
                  <p className="text-sm font-bold text-slate-700">
                    {book.total_pages} trang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Lượt đọc</p>
                  <p className="text-sm font-bold text-slate-700">
                    {book.read_count || 0} lượt
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Heart size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Yêu thích</p>
                  <p className="text-sm font-bold text-slate-700">
                    {book.favorite_count || 0} lượt
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Ngày thêm</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(book.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tóm tắt & Mô tả sách
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {book.description || "Không có tóm tắt chi tiết cho cuốn sách này."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quản lý đánh giá nhận xét */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Đánh giá từ người đọc ({reviews.length})
              </h2>
              <p className="text-xs text-slate-400">
                Kiểm duyệt và quản lý các bình luận đánh giá cuốn sách này.
              </p>
            </div>
          </div>

          {/* Tìm kiếm & Bộ lọc */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm kiếm đánh giá..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
              />
            </div>

            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600 cursor-pointer"
              >
                <option value="">Tất cả số sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách reviews */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase w-48">
                  Người dùng
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase w-32">
                  Đánh giá
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                  Nội dung nhận xét
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase w-40">
                  Thời gian
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right w-24">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                          {review.username?.charAt(0) || "U"}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {review.username || "Người dùng ẩn danh"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed max-w-md break-words">
                      {review.content}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(review.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa đánh giá này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400 italic">
                    {reviews.length === 0
                      ? "Chưa có đánh giá nào cho cuốn sách này."
                      : "Không tìm thấy đánh giá phù hợp bộ lọc."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookDetailPage;
