import React from "react";
import { MessageIcon } from "@react-pdf-viewer/highlight";

const NotesSidebar = ({ annotations, jumpToHighlightArea, deleteNote }) => {
  return (
    <div className="p-4 overflow-y-auto h-full w-full">
      <h3 className="font-bold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">
        Ghi chú của bạn
      </h3>
      {annotations.length === 0 ? (
        <p className="text-gray-400 text-sm">Chưa có ghi chú nào</p>
      ) : (
        annotations.map((ann) => (
          <div
            key={ann.id}
            className="p-3 mb-2 bg-yellow-50 dark:bg-gray-700 rounded border border-yellow-200 dark:border-gray-600 cursor-pointer hover:bg-yellow-100 dark:hover:bg-gray-600 transition-all"
            onClick={() => jumpToHighlightArea(ann.selectionRegion)}
          >
            <p className="text-sm break-words dark:text-gray-100">
              {ann.content}
            </p>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-400">
                Trang {ann.page_index + 1}
              </span>
              <button
                className="text-red-400 text-xs hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(ann.id);
                }}
                style={{ cursor: "pointer" }}
              >
                Xóa
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotesSidebar;
