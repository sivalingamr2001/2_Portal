import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "./context/AuthContext.tsx"
import { ThemeProvider } from "./context/ThemeProvider.tsx"
import { Toaster } from "./components/ui/sonner.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
