import React from "react";
import { Layout, Zap, Lock, Cloud, Globe, UserPlus } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import components and layouts
import { RootLayout } from "./src/components";
import { NotesPage, LandingPage } from "./src/pages";
import { useMigration } from "./src/hooks/useMigration";



const App: React.FC = () => {
  const { isLoaded: authLoaded } = useUser();
  const { isMigrating } = useMigration();

  if (!authLoaded)
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-white font-bold animate-pulse">
        Initializing...
      </div>
    );

  return (
    <BrowserRouter>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        {isMigrating && (
          <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 text-white">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto animate-bounce text-blue-500">
                <Cloud size={32} />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                Syncing Local Notes
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed text-balance">
                We're moving your local notes to your secure cloud account.
                Hang tight!
              </p>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-[loading_1.5s_infinite_ease-in-out]"></div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Navigate to="/notes" replace />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/:noteId" element={<NotesPage />} />
            <Route path="/starred" element={<NotesPage />} />
            <Route path="/starred/:noteId" element={<NotesPage />} />
            <Route path="/trash" element={<NotesPage />} />
            <Route path="/trash/:noteId" element={<NotesPage />} />
            <Route path="/folders/:folderId" element={<NotesPage />} />
            <Route path="/folders/:folderId/:noteId" element={<NotesPage />} />
            <Route path="/tags/:tagId" element={<NotesPage />} />
            <Route path="/tags/:tagId/:noteId" element={<NotesPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/notes" replace />} />
          </Route>
        </Routes>
      </SignedIn>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </BrowserRouter>
  );
};

export default App;
