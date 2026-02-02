import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppStateProvider } from "./context/AppStateContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatsProvider } from "./context/ChatsContext";
import { ContactsProvider } from "./context/ContactsContext";
import { CallProvider } from "./context/CallContext";
import { MessagesProvider } from "./context/MessagesContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { FeedProvider } from "./context/FeedContext";
import MainLayout from "./components/layout/MainLayout";
import FeedLayout from "./components/layout/FeedLayout";
import CallOverlay from "./components/call/CallOverlay";
import ChatsPage from "./pages/ChatsPage";
import ChatPage from "./pages/ChatPage";
import PostCommentsPage from "./pages/PostCommentsPage";
import ContactsPage from "./pages/ContactsPage";
import CallsPage from "./pages/CallsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import CreateChannelPage from "./pages/CreateChannelPage";
import FeedPage from "./pages/feed/FeedPage";
import FeedSearchPage from "./pages/feed/FeedSearchPage";
import FeedCreatePage from "./pages/feed/FeedCreatePage";
import FeedCreateStoryPage from "./pages/feed/FeedCreateStoryPage";
import FeedNotificationsPage from "./pages/feed/FeedNotificationsPage";
import FeedProfilePage from "./pages/feed/FeedProfilePage";
import FeedPostPage from "./pages/feed/FeedPostPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppStateProvider>
      <AuthProvider>
        <ChatsProvider>
          <ContactsProvider>
            <CallProvider>
              <MessagesProvider>
                <WebSocketProvider>
                <FeedProvider>
                <ThemeProvider attribute="class" defaultTheme="system" storageKey="messenger-theme" enableSystem>
                <TooltipProvider>
                  <BrowserRouter>
                    <CallOverlay />
                    <Routes>
                      <Route path="/login" element={<LoginRoute />} />
                      <Route element={<RequireAuth />}>
                        <Route element={<MainLayout />}>
                          <Route path="/" element={<ChatsPage />} />
                          <Route path="/contacts" element={<ContactsPage />} />
                          <Route path="/calls" element={<CallsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Route>
                        <Route path="/chat/:chatId" element={<ChatPage />} />
                        <Route path="/chat/:chatId/comments/:postId" element={<PostCommentsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/channel/create" element={<CreateChannelPage />} />
                        <Route path="/feed" element={<FeedLayout />}>
                          <Route index element={<FeedPage />} />
                          <Route path="search" element={<FeedSearchPage />} />
                          <Route path="create" element={<FeedCreatePage />} />
                          <Route path="story/create" element={<FeedCreateStoryPage />} />
                          <Route path="notifications" element={<FeedNotificationsPage />} />
                          <Route path="profile" element={<FeedProfilePage />} />
                          <Route path="profile/:userId" element={<FeedProfilePage />} />
                          <Route path="post/:postId" element={<FeedPostPage />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
                </ThemeProvider>
                </FeedProvider>
                </WebSocketProvider>
              </MessagesProvider>
            </CallProvider>
          </ContactsProvider>
        </ChatsProvider>
      </AuthProvider>
    </AppStateProvider>
  </QueryClientProvider>
);

export default App;
