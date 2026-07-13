import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Upload,
  BookOpen,
  User,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react"; 
import axiosClient from "../../api/axiosClient";
import SearchableSelect from "../../components/SearchableSelect";

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AdminUploadBookPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    author_id: null,
    description: "",
    category_id: null,
    is_premium: false,
    total_pages: 0,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  // Lấy danh sách danh mục và tác giả để đổ vào Select
  useEffect(() => {
    const fetchCategoriesAndAuthors = async () => {
      try {
        const [catRes, authorRes] = await Promise.all([
          axiosClient.get("/categories", { params: { all: true } }),
          axiosClient.get("/authors", { params: { all: true } }),
        ]);
        setCategories(catRes.data.categories || []);
        setAuthors(authorRes.data.authors || []);
      } catch (error) {
        console.error("Không lấy được danh mục hoặc tác giả", error);
      }
    };
    fetchCategoriesAndAuthors();
  }, []);

  const handleUploadAndSave = async (e) => {
    e.preventDefault();

    if (!formData.author_id) {
      toast.error("Vui lòng chọn tác giả cho sách.");
      return;
    }

    if (!formData.category_id) {
      toast.error("Vui lòng chọn danh mục cho sách.");
      return;
    }

    if (formData.total_pages === 0) {
      toast.error("Vui lòng đợi hệ thống xác nhận số trang PDF...");
      return;
    }

    setLoading(true);
    const toastId = toast.info("Bắt đầu quá trình tải lên...", {
      autoClose: false,
    });

    try {
      // BƯỚC 1: Lấy Presigned URL
      toast.update(toastId, { render: "Đang khởi tạo liên kết tải lên..." });
      const response = await axiosClient.post("/books/generate-upload-link", {
        coverName: coverFile.name,
        coverType: coverFile.type,
        bookName: bookFile.name,
        bookType: bookFile.type,
      });

      const urls = response.data.data; // Lưu ý truy cập data.data

      // BƯỚC 2: Upload trực tiếp lên S3
      toast.update(toastId, {
        render:
          "Đang tải file lên đám mây (S3)... Vui lòng không đóng trình duyệt.",
      });
      await Promise.all([
        axios.put(urls.cover_image.uploadUrl, coverFile, {
          headers: { "Content-Type": coverFile.type },
        }),
        axios.put(urls.book.uploadUrl, bookFile, {
          headers: { "Content-Type": bookFile.type },
        }),
      ]);

      // BƯỚC 3: Gửi Key về Backend
      toast.update(toastId, { render: "Đang hoàn tất thủ tục lưu trữ..." });
      await axiosClient.post("/books", {
        ...formData,
        cover_image_key: urls.cover_image.key,
        book_file_key: urls.book.key,
      });
      
      // Reset form
      setFormData({
        title: "",
        author_id: null,
        description: "",
        category_id: null,
        is_premium: false,
        total_pages: 0,
      });
      setCoverFile(null);
      setBookFile(null);
      setImagePreviewSrc(null);
      toast.update(toastId, {
        render: "Thêm sách mới thành công!",
        type: "success",
        autoClose: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Quá trình tạo sách thất bại",
        type: "error",
        autoClose: 5000,
      });
    } finally {
      
      setLoading(false);
    }
  };

  // Xử lý khi chọn file sách để đọc số trang
  const handleBookFileChange = async (file) => {
    if (!file) return;

    setBookFile(file);

    if (file.type === "application/pdf") {
      // Bật trạng thái xử lý và thông báo cho người dùng
      setIsProcessingPDF(true);
      const toastId = toast.info("Đang phân tích dữ liệu PDF...", {
        autoClose: false,
      });

      try {
        const reader = new FileReader();
        reader.onload = async function () {
          try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const numPages = pdf.numPages;

            setFormData((prev) => ({ ...prev, total_pages: numPages }));

            toast.update(toastId, {
              render: `Đã xác nhận: ${numPages} trang`,
              type: "success",
              autoClose: 2000, // Tự động đóng sau 2 giây
            });
          } catch (err) {
            toast.update(toastId, {
              render: "Không thể đọc cấu trúc file PDF",
              type: "error",
              autoClose: 4000,
            });
          } finally {
            setIsProcessingPDF(false); // Kết thúc xử lý
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Lỗi đọc file PDF:", error);
        toast.update(toastId, {
          render: "Lỗi trong quá trình đọc file",
          type: "error",
          autoClose: 4000,
        });
        setIsProcessingPDF(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6" /> Quản lý Tải lên Sách
          </h2>
          <p className="text-indigo-100 mt-1">
            Thêm nội dung mới vào thư viện hệ thống
          </p>
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
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
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
              <SearchableSelect
                options={authors}
                value={formData.author_id}
                onChange={(id) => setFormData({ ...formData, author_id: id })}
                placeholder="Chọn tác giả..."
              />
            </div>

            {/* Danh mục */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Danh mục
              </label>
              <SearchableSelect
                options={categories}
                value={formData.category_id}
                onChange={(id) => setFormData({ ...formData, category_id: id })}
                placeholder="Chọn danh mục..."
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Mô tả ngắn gọn
            </label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
                  onChange={(e) => {
                    setCoverFile(e.target.files[0]);
                    setImagePreviewSrc(URL.createObjectURL(e.target.files[0]));
                  }}
                  required
                />
                <div className="text-center">
                  <span className="text-xs text-gray-500 block truncate">
                    {coverFile ? coverFile.name : "Chọn file ảnh (JPG, PNG...)"}
                  </span>
                  {imagePreviewSrc && (
                    <img
                      src={imagePreviewSrc}
                      alt="Preview"
                      className="mt-2 mx-auto max-h-32 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Upload PDF */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Nội dung (PDF)
                {formData.total_pages > 0 && (
                  <span className="text-xs text-green-600 font-normal">
                    (Đã xác nhận: {formData.total_pages} trang)
                  </span>
                )}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleBookFileChange(e.target.files[0])}
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
              onChange={(e) =>
                setFormData({ ...formData, is_premium: e.target.checked })
              }
              checked={formData.is_premium}
            />
            <label
              htmlFor="premium"
              className="text-sm font-medium text-indigo-900 cursor-pointer"
            >
              Đánh dấu là nội dung Premium (Yêu cầu hội viên trả phí)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isProcessingPDF}
            className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              loading || isProcessingPDF
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải lên kho...
              </>
            ) : isProcessingPDF ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý PDF...
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
