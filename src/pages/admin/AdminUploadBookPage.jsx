import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Upload, BookOpen, User, Image as ImageIcon, FileText, Loader2 } from "lucide-react"; // Sử dụng Lucide icons có sẵn trong project
import axiosClient from "../../api/axiosClient";

const AdminUploadBookPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    category_id: 1,
    is_premium: false,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách danh mục để đổ vào Select
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get("/categories");
        setCategories(res.data.categories || []);
      } catch (error) {
        console.error("Không lấy được danh mục", error);
      }
    };
    fetchCategories();
  }, []);

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // BƯỚC 1: Lấy Presigned URL
      const response = await axiosClient.post("/books/generate-upload-link", {
        coverName: coverFile.name,
        coverType: coverFile.type,
        bookName: bookFile.name,
        bookType: bookFile.type,
      });

      const urls = response.data.data; // Lưu ý truy cập data.data

      // BƯỚC 2: Upload trực tiếp lên S3
      await Promise.all([
        axios.put(urls.cover_image.uploadUrl, coverFile, {
          headers: { "Content-Type": coverFile.type },
        }),
        axios.put(urls.book.uploadUrl, bookFile, {
          headers: { "Content-Type": bookFile.type },
        }),
      ]);

      // BƯỚC 3: Gửi Key về Backend
      await axiosClient.post("/books", {
        ...formData,
        cover_image_key: urls.cover_image.key,
        book_file_key: urls.book.key,
      });

      toast.success("Thêm sách mới thành công!");
      // Reset form
      setFormData({ title: "", author: "", description: "", category_id: 1, is_premium: false });
      setCoverFile(null);
      setBookFile(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Quá trình tạo sách thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6" /> Quản lý Tải lên Sách
          </h2>
          <p className="text-indigo-100 mt-1">Thêm nội dung mới vào thư viện hệ thống</p>
        </div>

        <form onSubmit={handleUploadAndSave} className="p-8 space-y-6">
          {/* Tên sách */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Tên cuốn sách
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đắc Nhân Tâm"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              value={formData.title}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tác giả */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Tác giả
              </label>
              <input
                type="text"
                placeholder="Tên tác giả"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                value={formData.author}
                required
              />
            </div>

            {/* Danh mục */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Danh mục</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                value={formData.category_id}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Mô tả ngắn gọn</label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              value={formData.description}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Ảnh bìa */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> Ảnh bìa
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  required
                />
                <div className="text-center">
                  <span className="text-xs text-gray-500 block truncate">
                    {coverFile ? coverFile.name : "Chọn file ảnh (JPG, PNG...)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload PDF */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Nội dung (PDF)
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setBookFile(e.target.files[0])}
                  required
                />
                <div className="text-center">
                  <span className="text-xs text-gray-500 block truncate">
                    {bookFile ? bookFile.name : "Chọn file sách (PDF)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <input
              type="checkbox"
              id="premium"
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
              onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
              checked={formData.is_premium}
            />
            <label htmlFor="premium" className="text-sm font-medium text-indigo-900 cursor-pointer">
              Đánh dấu là nội dung Premium (Yêu cầu hội viên trả phí)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              "Hoàn tất & Tải lên Thư viện"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminUploadBookPage;