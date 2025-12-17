import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  ChevronLeft, AlertCircle, Loader, Lock 
} from 'lucide-react';

const BookReadingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [bookTitle, setBookTitle] = useState('');
  const [readUrl, setReadUrl] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Lấy thông tin sách
        try {
            const detailRes = await axiosClient.get(`/books/${id}`);

            const bookData = detailRes.book;
            setBookTitle(bookData.title || "Tiêu đề sách không xác định");
        } catch (e) {
            console.warn("Không lấy được tên sách:", e);
        }

        // 2. Lấy URL đọc sách
        const readRes = await axiosClient.get(`/books/read/${id}`);
        const url = readRes.readUrl || readRes.data?.readUrl;
        
        if (!url) {
            throw new Error("Không tìm thấy đường dẫn file PDF.");
        }
        setReadUrl(url);

      } catch (err) {
        console.error("Lỗi khi tải sách:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            setError({
                type: 'auth',
                message: err.response?.data?.message || "Vui lòng đăng nhập hoặc nâng cấp tài khoản để đọc sách này."
            });
        } else {
            setError({
                type: 'general',
                message: "Không thể tải nội dung sách. Vui lòng thử lại sau."
            });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- Render Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium animate-pulse">Đang tải tài liệu...</p>
      </div>
    );
  }

  // --- Render Error ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
            {error.type === 'auth' ? (
                <div className="text-yellow-600 mb-4 flex justify-center"><Lock size={48} /></div>
            ) : (
                <div className="text-red-500 mb-4 flex justify-center"><AlertCircle size={48} /></div>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi truy cập</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error.message}</p>
            
            <div className="flex gap-3 justify-center">
                <button onClick={() => navigate(-1)} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Quay lại
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- Render PDF View ---
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        
        {/* Header Toolbar */}
        <header className="h-14 flex items-center justify-between px-4 shadow-md z-10 shrink-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-colors duration-300">
            
            {/* Left: Back & Title */}
            <div className="flex items-center overflow-hidden gap-3">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Quay lại"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="font-semibold text-lg truncate max-w-50 sm:max-w-md">
                    {bookTitle}
                </span>
            </div>
        </header>
        
        {/* PDF Iframe Container */}
        <div className="flex-1 w-full relative overflow-hidden">
            <iframe 
                src={readUrl} 
                title="Book Content"
                className="w-full h-full border-0 block"
                allowFullScreen
            />
        </div>
    </div>
  );
};

export default BookReadingPage;