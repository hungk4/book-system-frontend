import { Worker, Viewer, ScrollMode, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { searchPlugin } from "@react-pdf-viewer/search";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { Subject } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosClient from "../api/axiosClient.js";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

import { highlightPlugin, MessageIcon } from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import NotesSidebar from "./NotesSidebar.jsx";

const BookReader = ({ bookId, initialPage, totalPages, zoomScale, sidebarTrigger, onPageChange, onError }) => {
  const [currentPage, setCurrentPage] = useState(initialPage + 1); // 1-based (Ví dụ: 5)
  const [chunkStartPage, setChunkStartPage] = useState(1);         // 1-based (Trang bắt đầu của chunk)
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);

  const CHUNK_SIZE = 3;

  // Cache các phân đoạn PDF ngay tại Frontend
  // Cấu trúc: { [startPage]: { data: Uint8Array, timestamp: number } }
  const chunkCacheRef = useRef({}); 
  const CACHE_TTL_MS = 15 * 60 * 1000; // Thời gian sống của cache: 15 phút

  const searchPluginInstance = searchPlugin();
  const { ShowSearchPopover } = searchPluginInstance;

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      // defaultTabs[0], // Ẩn tab Thumbnail mặc định
      {
        content: (
          <NotesSidebar
            annotations={annotations}
            jumpToHighlightArea={(region) => handleJumpToHighlightArea(region)}
            deleteNote={deleteNote}
          />
        ),
        icon: <MessageIcon />,
        title: "Ghi chú",
      },
    ],
    renderToolbar: () => <></>, // Ẩn thanh công cụ mặc định hoàn toàn!
  });

  // Lắng nghe sự kiện đổi theme từ Header
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    const handleThemeUpdate = () => {
      const themeInStorage = localStorage.getItem("theme") || "light";
      setTheme(themeInStorage);
    };

    window.addEventListener("themeChanged", handleThemeUpdate);
    return () => {
      window.removeEventListener("themeChanged", handleThemeUpdate);
    };
  }, []);

  // Đồng bộ hóa trang hiện tại ra ngoài component cha
  useEffect(() => {
    if (onPageChange && currentPage) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Đồng bộ hóa tỷ lệ thu phóng (Zoom Scale) từ component cha
  useEffect(() => {
    if (zoomScale) {
      try {
        const zoomPlugin = defaultLayoutPluginInstance.toolbarPluginInstance.zoomPluginInstance;
        zoomPlugin.zoomTo(zoomScale);
      } catch (err) {
        console.warn("Không thể zoom tự động:", err);
      }
    }
  }, [zoomScale]);

  // Đồng bộ hóa bật/tắt Sidebar từ component cha
  useEffect(() => {
    if (sidebarTrigger > 0) {
      try {
        defaultLayoutPluginInstance.toggleTab(0);
      } catch (err) {
        console.warn("Không thể bật/tắt sidebar tự động:", err);
      }
    }
  }, [sidebarTrigger]);

  // Sử dụng Ref để theo dõi trang đang hoạt động và thời gian đọc tích lũy
  const activePageRef = useRef(currentPage - 1);
  const secondsRef = useRef(0);

  // Gửi thời gian đọc của một trang lên Server
  const sendReadTime = async (pageIdx, secs) => {
    if (secs <= 0) return;
    try {
      const res = await axiosClient.post(`/books/${bookId}/read-time`, {
        page_index: pageIdx, // 0-based index
        seconds: secs
      });
      if (res.data.success && res.data.awardGranted) {
        toast.success(res.data.message, {
          position: "top-center",
          autoClose: 5000
        });
      }
    } catch (err) {
      console.error("Lỗi khi gửi thời gian đọc sách:", err);
    }
  };

  // Thiết lập bộ đếm thời gian (Timer) chạy mỗi giây, gửi khi currentPage thay đổi
  useEffect(() => {
    activePageRef.current = currentPage - 1;
    secondsRef.current = 0;

    const interval = setInterval(() => {
      secondsRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
      const finalPage = activePageRef.current;
      const finalSecs = secondsRef.current;
      if (finalSecs > 0) {
        sendReadTime(finalPage, finalSecs);
      }
    };
  }, [currentPage, bookId]);

  // Xử lý lưu bookmark khi đổi trang (RxJS debounce)
  const pageSubject$ = useMemo(() => new Subject(), []);
  useEffect(() => {
    const stream$ = pageSubject$.pipe(
      debounceTime(1000),
      switchMap((page) =>
        axiosClient
          .post(`/books/${bookId}/bookmark`, { pageNumber: page })
          .catch((err) => {
            console.error("API Error - Không thể lưu bookmark:", err);
            return Promise.resolve(null);
          }),
      ),
    );

    const subscription = stream$.subscribe({
      next: () => console.log("RxJS: Lưu bookmark thành công"),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pageSubject$, bookId]);

  // Kích hoạt gửi bookmark khi thay đổi currentPage
  useEffect(() => {
    if (currentPage) {
      pageSubject$.next(currentPage);
    }
  }, [currentPage, pageSubject$]);

  // Tải phân đoạn PDF khi trang hiện tại vượt ngoài phân đoạn hiện có
  useEffect(() => {
    const isPageInCurrentChunk =
      currentPage >= chunkStartPage &&
      currentPage < chunkStartPage + CHUNK_SIZE;

    if (isPageInCurrentChunk && pdfData) return;

    // Tính toán trang bắt đầu của phân đoạn mới
    const newStartPage = Math.max(1, currentPage);
    setChunkStartPage(newStartPage);

    const fetchChunkBytes = async () => {
      const now = Date.now();

      // Dọn dẹp cache đã quá hạn (VD: > 15 phút không được truy cập)
      Object.keys(chunkCacheRef.current).forEach((key) => {
        if (now - chunkCacheRef.current[key].timestamp > CACHE_TTL_MS) {
          delete chunkCacheRef.current[key];
        }
      });

      // Kiểm tra cache hợp lệ
      if (chunkCacheRef.current[newStartPage]) {
        chunkCacheRef.current[newStartPage].timestamp = now; // Cập nhật lại thời gian truy cập
        setPdfData(chunkCacheRef.current[newStartPage].data);
        return;
      }

      setLoading(true);
      try {
        const res = await axiosClient.get(
          `/books/read/${bookId}?startPage=${newStartPage}`,
          { responseType: "arraybuffer" }
        );
        
        const bytes = new Uint8Array(res.data);
        
        // Lưu phân đoạn vào bộ nhớ đệm kèm thời gian hiện tại
        chunkCacheRef.current[newStartPage] = {
          data: bytes,
          timestamp: now
        };
        
        setPdfData(bytes);
      } catch (err) {
        console.error("Lỗi tải phân đoạn PDF:", err);
        const status = err.response?.status;
        const errorMap = {
          401: {
            type: "auth",
            status: 401,
            message: "Vui lòng đăng nhập để có thể đọc sách này.",
          },
          403: {
            type: "auth",
            status: 403,
            message: "Bạn cần nâng cấp gói hội viên để xem nội dung Premium.",
          },
        };
        const errObj = errorMap[status] || {
          type: "system",
          message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
        };
        if (onError) onError(errObj);
      } finally {
        setLoading(false);
      }
    };

    fetchChunkBytes();
  }, [currentPage, bookId, chunkStartPage, onError]);

  // Lắng nghe thay đổi trang của PDF Viewer
  const handlePageChange = (e) => {
    const newActualPage = chunkStartPage + e.currentPage;
    if (newActualPage <= totalPages && newActualPage !== currentPage) {
      setCurrentPage(newActualPage);
    }
  };

  // Đồng bộ vị trí Viewer khi currentPage thay đổi (trong cùng chunk)
  useEffect(() => {
    if (pdfData) {
      const relativePage = currentPage - chunkStartPage;
      try {
        jumpToPage(relativePage);
      } catch (err) {
        console.warn("Chưa thể tự động nhảy trang:", err);
      }
    }
  }, [currentPage, chunkStartPage, pdfData, jumpToPage]);

  // Chặn sao chép
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      alert("Chức năng sao chép bị vô hiệu hóa trên tài liệu này!");
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // --- Annotations (Ghi chú & Highlight) ---
  const [annotations, setAnnotations] = useState([]);
  const [tempNote, setTempNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 1. Tải danh sách ghi chú
  useEffect(() => {
    axiosClient
      .get(`/books/${bookId}/annotations`)
      .then((res) => setAnnotations(res.data.annotations))
      .catch((err) => console.error("Lỗi tải ghi chú:", err));
  }, [bookId]);

  // 2. Xóa ghi chú
  const deleteNote = (id) => {
    if (window.confirm("Xóa ghi chú này?")) {
      axiosClient
        .delete(`/books/annotations/${id}`)
        .then(() => setAnnotations(annotations.filter((a) => a.id !== id)));
    }
  };

  // 3. Nhảy nhanh đến ghi chú (Xử lý nhảy qua chunk)
  const handleJumpToHighlightArea = (selectionRegion) => {
    const targetPageIndex = selectionRegion.pageIndex;
    const targetPageNumber = targetPageIndex + 1;

    const isPageInCurrentChunk =
      targetPageNumber >= chunkStartPage &&
      targetPageNumber < chunkStartPage + CHUNK_SIZE;

    if (!isPageInCurrentChunk) {
      setCurrentPage(targetPageNumber);
      setTimeout(() => {
        const relativePageIndex = targetPageIndex - (targetPageNumber - 1);
        try {
          jumpToHighlightArea({
            ...selectionRegion,
            pageIndex: relativePageIndex
          });
        } catch (err) {
          console.warn("Chưa thể nhảy đến highlight sau khi chuyển chunk:", err);
        }
      }, 1000);
    } else {
      const relativePageIndex = targetPageIndex - (chunkStartPage - 1);
      try {
        jumpToHighlightArea({
          ...selectionRegion,
          pageIndex: relativePageIndex
        });
      } catch (err) {
        console.warn("Chưa thể nhảy đến highlight:", err);
      }
    }
  };

  // 4. Form nhập liệu ghi chú mới khi bôi đen
  const renderHighlightTarget = (props) => (
    <div
      className="shadow-2xl border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-2 absolute z-[100]"
      style={{
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        width: isEditing ? "250px" : "auto",
      }}
    >
      {!isEditing ? (
        <button
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          Ghi chú
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full p-2 text-sm border rounded outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
            rows="3"
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              className="text-xs text-gray-400 cursor-pointer"
              onClick={() => {
                setIsEditing(false);
                props.toggle();
              }}
            >
              Hủy
            </button>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs cursor-pointer"
              onClick={() => {
                const actualPageIdx = chunkStartPage - 1 + props.selectionRegion.pageIndex;
                const newNote = {
                  pageIndex: actualPageIdx,
                  content: tempNote,
                  selectionRegion: {
                    ...props.selectionRegion,
                    pageIndex: actualPageIdx
                  },
                };
                axiosClient
                  .post(`/books/${bookId}/annotations`, newNote)
                  .then((res) => {
                    setAnnotations([...annotations, res.data.annotation]);
                    setTempNote("");
                    setIsEditing(false);
                    props.toggle();
                  });
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 5. Vẽ highlight đã bôi đen
  const renderHighlights = (props) => {
    const actualPageIdx = chunkStartPage - 1 + props.pageIndex;
    return (
      <div>
        {annotations
          .filter((ann) => Number(ann.page_index) === actualPageIdx)
          .map((ann, idx) => (
            <React.Fragment key={idx}>
              <div
                className="group absolute"
                style={Object.assign(
                  {},
                  props.getCssProperties({
                    ...ann.selectionRegion,
                    pageIndex: props.pageIndex
                  }, props.rotation),
                  {
                    zIndex: 10,
                  },
                )}
              >
                <div
                  style={{
                    background: "yellow",
                    opacity: 0.4,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                />

                {ann.content && (
                  <div
                    className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                             w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-xl z-50 pointer-events-none"
                  >
                    {ann.content}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 
                               border-8 border-transparent border-t-gray-900"
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
      </div>
    );
  };

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });
  const { jumpToHighlightArea } = highlightPluginInstance;

  return (
    <div
      className={`flex flex-col h-full ${theme === "dark" ? "pdf-dark-filter" : ""}`}
      style={{ width: "100%" }}
    >
      <div className="flex-1 w-full relative overflow-hidden bg-gray-200">
        {/* Nút lùi trang tuyệt đối (bên trái) */}
        {currentPage > 1 && (
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full transition-all duration-200 border border-white/10 cursor-pointer shadow-2xl active:scale-90"
            title="Trang trước"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Nút tiến trang tuyệt đối (bên phải) */}
        {currentPage < totalPages && (
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full transition-all duration-200 border border-white/10 cursor-pointer shadow-2xl active:scale-90"
            title="Trang sau"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-medium animate-pulse">Đang tải phân đoạn tiếp theo...</p>
          </div>
        ) : (
          pdfData && (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfData}
                defaultScale={SpecialZoomLevel.PageFit}
                scrollMode={ScrollMode.Page}
                initialPage={currentPage - chunkStartPage}
                onPageChange={handlePageChange}
                plugins={[
                  defaultLayoutPluginInstance,
                  searchPluginInstance,
                  highlightPluginInstance,
                  pageNavigationPluginInstance,
                ]}
                theme={theme}
              />
            </Worker>
          )
        )}
      </div>

      {/* Thanh hiển thị tiến độ đọc ở dưới */}
      <div className={`px-6 py-4 border-t flex flex-col justify-center shrink-0 z-20 transition-all select-none ${theme === 'dark' ? 'bg-[#181818] border-[#282828] text-gray-200' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="max-w-4xl w-full mx-auto">
          {/* Progress Percent (right aligned) */}
          <div className="flex justify-end items-center mb-1">
            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
              {Math.min(Math.round((currentPage / totalPages) * 100), 100)}%
            </span>
          </div>

          {/* Slider input */}
          <div className="w-full relative flex items-center h-2">
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const targetPage = parseInt(e.target.value);
                if (targetPage >= 1 && targetPage <= totalPages) {
                  setCurrentPage(targetPage);
                }
              }}
              className={`w-full h-1 rounded-full appearance-none cursor-pointer outline-none transition-all ${theme === 'dark' ? 'bg-[#2d2d2d]' : 'bg-slate-200'}`}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentPage - 1) / (totalPages - 1 || 1)) * 100}%, ${theme === 'dark' ? '#2d2d2d' : '#e2e8f0'} ${((currentPage - 1) / (totalPages - 1 || 1)) * 100}%, ${theme === 'dark' ? '#2d2d2d' : '#e2e8f0'} 100%)`
              }}
            />
          </div>

          {/* Page Indicator (centered) */}
          <p className={`text-xs mt-2 flex items-center justify-center gap-1.5 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
            <BookOpen className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            Trang {currentPage} / {totalPages}
          </p>
        </div>
      </div>

      <style jsx="true">{`
        /* ===== Ẩn các phần UI mặc định của react-pdf-viewer ===== */

        /* Toolbar trên cùng (nền xám chứa nút zoom, search, download...)
           Ẩn vì hệ thống đã có header riêng với các controls tuỳ chỉnh */
        .rpv-default-layout__toolbar {
          display: none !important;
        }

        /* Dải icon tab bên trái sidebar (thumbnail, attachment...)
           Ẩn vì sidebar được bật/tắt qua nút List trên header của hệ thống */
        .rpv-default-layout__sidebar-headers {
          display: none !important;
        }

        /* Thanh tiêu đề bên trong từng panel sidebar ("Ghi chú", "Thumbnail"...)
           Ẩn vì NotesSidebar tự render tiêu đề riêng */
        .rpv-default-layout__sidebar-header {
          display: none !important;
        }

        /* Xoá padding 40px mặc định của container sidebar
           Nếu để nguyên sẽ tạo khoảng trắng/xám trống phía trên nội dung */
        .rpv-default-layout__sidebar {
          padding: 0 !important;
        }

        /* ===== Chế độ tối (Dark mode) ===== */

        /* Đảo màu canvas PDF bằng CSS filter:
           invert(1) đảo màu trắng↔đen, hue-rotate(180deg) khôi phục màu sắc nội dung.
           Kết quả: nền trắng → đen, chữ đen → trắng, màu sắc giữ nguyên sắc tương đối */
        .pdf-dark-filter .rpv-core__canvas-layer {
          filter: invert(1) hue-rotate(180deg) !important;
        }

        /* Nền vùng hiển thị trang PDF trong dark mode */
        .pdf-dark-filter .rpv-core__inner-pages {
          background-color: #121212 !important;
          overflow: hidden !important;
        }

        /* Ẩn scrollbar của viewer — việc điều hướng trang được xử lý
           bởi nút ChevronLeft/ChevronRight và thanh range ở dưới */
        .rpv-core__inner-pages {
          overflow: hidden !important;
        }

        /* Ẩn overlay fullscreen mặc định của thư viện
           Fullscreen được quản lý bởi nút Maximize trên header hệ thống */
        .rpv-full-screen__overlay {
          display: none !important;
        }

        /* ===== Thanh tiến độ đọc (range input) ===== */

        /* Tuỳ chỉnh hình tròn kéo (thumb) trên Chrome / Safari / Edge */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: transform 0.1s ease;
          /* Viền màu khớp nền để tạo hiệu ứng tách biệt với track */
          border: 2px solid ${theme === 'dark' ? '#181818' : '#ffffff'};
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }

        /* Tuỳ chỉnh thumb tương tự cho Firefox */
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: 2px solid ${theme === 'dark' ? '#181818' : '#ffffff'};
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};

export default BookReader;
