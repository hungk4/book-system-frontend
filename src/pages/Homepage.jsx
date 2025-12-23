import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import BookCard from '../components/BookCard';
import { Loader, BookOpen } from 'lucide-react';

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [booksRes, categoriesRes] = await Promise.all([
          axiosClient.get('/books'),
          axiosClient.get('/categories')
        ]);
        setBooks(booksRes.data.books || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối Server.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Xử lý lọc
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setLoading(true);

    try {
      const url = categoryId ? `/books?categoryId=${categoryId}` : '/books';
      const response = await axiosClient.get(url);
      setBooks(response.data.books || []);
    } catch (err) {
      console.error("Lỗi lọc sách:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading ban đầu (chỉ hiện khi chưa có gì cả)
  if (loading && books.length === 0 && categories.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={48} />
        <span className="text-gray-500 dark:text-gray-400 font-medium">Đang tải thư viện sách...</span>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 max-w-lg">
                <h3 className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">Đã xảy ra lỗi</h3>
                <p className="text-gray-600 dark:text-gray-300">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Thử lại
                </button>
            </div>
        </div>
    );
  }

  return (
    <div>
      {/* 1. Banner (Luôn hiển thị) */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-2xl p-8 mb-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Khám Phá Tri Thức Mới</h1>
            <p className="text-blue-100 dark:text-slate-300 max-w-xl text-lg">Hàng ngàn cuốn sách hay đang chờ bạn đọc và trải nghiệm.</p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* 2. Thanh Tiêu đề & Bộ lọc (Luôn hiển thị) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className="w-2 h-8 bg-blue-600 dark:bg-blue-500 rounded-full mr-3"></span>
            {selectedCategory 
              ? `Sách thuộc: ${categories.find(c => c.id == selectedCategory)?.name || '...'}` 
              : 'Sách Mới Cập Nhật'}
        </h2>
        
        <div className="flex space-x-2 w-full sm:w-auto">
            <select 
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto cursor-pointer"
            >
                <option value="">Tất cả thể loại</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>
        </div>
      </div>

      {/* 3. Phần Nội dung (Thay đổi tùy theo dữ liệu) */}
      {loading ? (
         // Skeleton loading nhẹ khi đang lọc
         <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
         </div>
      ) : books.length === 0 ? (
        // Hiển thị thông báo khi không có sách (nhưng vẫn giữ Banner & Filter ở trên)
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <div className="inline-block p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
                <BookOpen size={32} className="text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy sách nào</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Vui lòng thử chọn thể loại khác.</p>
            {selectedCategory && (
                <button 
                    onClick={() => handleCategoryChange({ target: { value: '' } })}
                    className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                >
                    Xem tất cả sách
                </button>
            )}
        </div>
      ) : (
        // Hiển thị danh sách sách
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;