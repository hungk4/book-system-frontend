import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Upload,
  BookOpen,
  User,
  Image as ImageIcon,
  FileText,
  Loader2,
  Save,
  ArrowLeft
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import SearchableSelect from "../../components/SearchableSelect";

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AdminEditBookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    author_id: 1,
    description: "",
    category_id: "",
    is_premium: false,
    total_pages: 0,
    cover_image_key: "",
    book_file_key: ""
  });

  const [coverFile, setCoverFile] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Trạng thái tải dữ liệu ban đầu
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  // 1. Tải thông tin sách và danh mục khi vào trang
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, bookRes, authorRes] = await Promise.all([
          axiosClient.get("/categories", { params: { all: true } }),
          axiosClient.get(`/books/${id}`),
          axiosClient.get("/authors", { params: { all: true } }),
        ]);

        setCategories(catRes.data.categories || []);
        setAuthors(authorRes.data.authors || []);
        
        const book = bookRes.data.book;
        setFormData({
          title: book.title,
          author_id: book.author_id || (authorRes.data.authors.length > 0 ? authorRes.data.authors[0].id : 1),
          description: book.description || "",
          category_id: book.category_id,
          is_premium: book.is_premium,
          total_pages: book.total_pages,
          cover_image_key: book.cover_image_key,
          book_file_key: book.book_file_key
        });
        
        // Hiển thị ảnh cũ nếu có
        if (book.cover_url) {
          setImagePreviewSrc(book.cover_url);
        }

      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin sách");
        navigate("/admin/books");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // 2. Xử lý đọc số trang PDF mới nếu người dùng thay đổi file
  const handleBookFileChange = async (file) => {
    if (!file) return;
    setBookFile(file);

    if (file.type === "application/pdf") {
      setIsProcessingPDF(true);
      const toastId = toast.info("Đang phân tích PDF mới...", { autoClose: false });

      try {
        const reader = new FileReader();
        reader.onload = async function () {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          setFormData((prev) => ({ ...prev, total_pages: pdf.numPages }));
          toast.update(toastId, {
            render: `Đã xác nhận: ${pdf.numPages} trang`,
            type: "success",
            autoClose: 2000,
          });
          setIsProcessingPDF(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        toast.update(toastId, { render: "Lỗi đọc PDF", type: "error", autoClose: 3000 });
        setIsProcessingPDF(false);
      }
    }
  };

  // 3. Xử lý Lưu thay đổi
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.info("Đang cập nhật...", { autoClose: false });

    try {
      let finalCoverKey = formData.cover_image_key;
      let finalBookKey = formData.book_file_key;

      // Nếu có chọn file mới thì mới upload lên S3
      if (coverFile || bookFile) {
        toast.update(toastId, { render: "Đang tải file mới lên S3..." });
        
        const response = await axiosClient.post("/books/generate-upload-link", {
          coverName: coverFile ? coverFile.name : "old",
          coverType: coverFile ? coverFile.type : "image/jpeg",
          bookName: bookFile ? bookFile.name : "old",
          bookType: bookFile ? bookFile.type : "application/pdf",
        });

        const urls = response.data.data;

        const uploads = [];
        if (coverFile) {
          uploads.push(axios.put(urls.cover_image.uploadUrl, coverFile, {
            headers: { "Content-Type": coverFile.type }
          }));
          finalCoverKey = urls.cover_image.key;
        }
        if (bookFile) {
          uploads.push(axios.put(urls.book.uploadUrl, bookFile, {
            headers: { "Content-Type": bookFile.type }
          }));
          finalBookKey = urls.book.key;
        }

        await Promise.all(uploads);
      }

      // Gửi lệnh PUT về Backend
      await axiosClient.put(`/books/${id}`, {
        ...formData,
        cover_image_key: finalCoverKey,
        book_file_key: finalBookKey,
      });

      toast.update(toastId, {
        render: "Cập nhật thành công!",
        type: "success",
        autoClose: 2000,
      });
      navigate("/admin/books");
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Cập nhật thất bại",
        type: "error",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Save className="w-6 h-6" /> Chỉnh sửa Sách
            </h2>
            <p className="text-indigo-100 mt-1">Cập nhật thông tin cho cuốn sách của bạn</p>
          </div>
          <button 
            onClick={() => navigate("/admin/books")}
            className="text-white hover:bg-indigo-700 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          {/* Tên sách */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Tên cuốn sách
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <label className="text-sm font-semibold text-gray-700">Danh mục</label>
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
            <label className="text-sm font-semibold text-gray-700">Mô tả nội dung</label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sửa Ảnh bìa */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> Ảnh bìa (Chọn để thay đổi)
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCoverFile(file);
                      setImagePreviewSrc(URL.createObjectURL(file));
                    }
                  }}
                />
                <div className="text-center">
                  <span className="text-xs text-gray-500 block truncate px-2">
                    {coverFile ? coverFile.name : "Giữ ảnh hiện tại hoặc chọn ảnh mới"}
                  </span>
                  {imagePreviewSrc && (
                    <img src={imagePreviewSrc} alt="Preview" className="mt-2 mx-auto max-h-32 object-contain rounded shadow" />
                  )}
                </div>
              </div>
            </div>

            {/* Sửa PDF */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Nội dung PDF (Chọn để thay đổi)
                {formData.total_pages > 0 && (
                  <span className="text-xs text-indigo-600 font-normal">({formData.total_pages} trang)</span>
                )}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleBookFileChange(e.target.files[0])}
                />
                <div className="text-center">
                  <span className="text-xs text-gray-500 block truncate px-2">
                    {bookFile ? bookFile.name : "Giữ file hiện tại hoặc chọn PDF mới"}
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
              checked={formData.is_premium}
              onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
            />
            <label htmlFor="premium" className="text-sm font-medium text-indigo-900 cursor-pointer">
              Đánh dấu nội dung Premium (Yêu cầu trả phí)
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
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...</>
            ) : isProcessingPDF ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý PDF...</>
            ) : (
              "Lưu các thay đổi"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminEditBookPage;