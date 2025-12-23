import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import HomePage from "./pages/Homepage";
import BookDetailPage from "./pages/BookDetailPage";
import BookReadingPage from "./pages/BookReadingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import AdminUploadBookPage from "./pages/admin/AdminUploadBookPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="book/:id" element={<BookDetailPage />} />
          <Route path="read/:id" element={<BookReadingPage />} />

          <Route path="admin/upload" element={<AdminUploadBookPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
