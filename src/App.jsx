import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import MainLayout from "./components/layouts/MainLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminRoute from "./components/AdminRoute";

import HomePage from "./pages/Homepage";
import BookDetailPage from "./pages/BookDetailPage";
import BookReadingPage from "./pages/BookReadingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PaymentResult from "./pages/PaymentResult";
import MyLibraryPage from "./pages/MyLibraryPage";
import SubscriptionManagePage from "./pages/SubscriptionManagePage";
import RewardsPage from "./pages/RewardsPage";
import AccountPage from "./pages/AccountPage";

import AdminUploadBookPage from "./pages/admin/AdminUploadBookPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooksPage from "./pages/admin/AdminBooksPage";
import AdminEditBookPage from "./pages/admin/AdminEditBookPage";
import AdminBookDetailPage from "./pages/admin/AdminBookDetailPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminAuthorsPage from "./pages/admin/AdminAuthorsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="book/:id" element={<BookDetailPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="payment-result" element={<PaymentResult />} />
          <Route path="/my-library" element={<MyLibraryPage />}></Route>
          <Route path="/subscription/manage" element={<SubscriptionManagePage />}></Route>
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="read/:id" element={<BookReadingPage />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="upload" element={<AdminUploadBookPage />} />
            <Route path="books" element={<AdminBooksPage />} />
            <Route path="books/:id" element={<AdminBookDetailPage />} />
            <Route path="edit-book/:id" element={<AdminEditBookPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="authors" element={<AdminAuthorsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
