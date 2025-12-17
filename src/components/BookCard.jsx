import React from 'react';
import { Book, User, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {

  const rating = book.rating || 4.5;
  
  return (
    <Link 
      to={`/book/${book.id}`}
      className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden"
    >
      {/* 1. Phần Ảnh Bìa*/}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100 dark:bg-slate-700">
        {book.cover_image_key ? (
          <img 
            src={book.cover_image_key} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Book size={48} className="mb-2 opacity-50" />
            <span className="text-xs font-medium">No Cover</span>
          </div>
        )}

        {/* Badge: Thể loại (Hiện trên ảnh) */}
        {book.category_name && (
          <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {book.category_name}
          </span>
        )}

        {/* Badge: Premium (Nếu có) */}
        {book.is_premium && (
          <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center">
            <Star size={10} className="mr-1 fill-white" /> premium
          </span>
        )}
        
        {/* Overlay khi hover (Nút đọc nhanh) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <span className="bg-white text-gray-900 font-medium px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                 Xem chi tiết
             </span>
        </div>
      </div>

      {/* 2. Phần Thông tin */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Tên sách */}
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={book.title}>
          {book.title}
        </h3>

        {/* Tác giả */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <User size={14} className="mr-1.5" />
          <span className="truncate">{book.author || "Tác giả ẩn danh"}</span>
        </div>

        {/* Divider nhỏ */}
        <div className="mt-auto border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            {/* Đánh giá sao */}
            <div className="flex items-center text-yellow-500 font-medium">
                <Star size={14} className="fill-yellow-500 mr-1" />
                <span>{rating}</span>
            </div>

            {/* Thời gian đăng hoặc thông tin khác */}
            <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>Mới cập nhật</span>
            </div>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;