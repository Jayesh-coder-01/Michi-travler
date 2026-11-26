import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';
import JourneyDetailPage from './pages/JourneyDetailPage';
import CreateTripPage from './pages/CreateTripPage';
import LoginPage from './pages/LoginPage';
import ChatbotPage from './pages/ChatbotPage';
import ChatbotWidget from './components/ChatbotWidget';

function AppShell() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';

  return (
    <div
      data-testid="michi-app"
      className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
    >
      {!isAuthPage && <Header />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/journey/:id" element={<JourneyDetailPage />} />
          <Route path="/create-trip" element={<CreateTripPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<ChatbotPage />} />
        </Routes>
      </div>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <ChatbotWidget />}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppStateProvider>
  );
}
