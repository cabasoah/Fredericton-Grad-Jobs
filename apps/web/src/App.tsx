// Router
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

// Pages
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import NotFoundPage from "./pages/NotFoundPage";
import JobPage from "./pages/JobPage";
import AddJobPage from "./pages/AddJobPage";
import EditJobPage from "./pages/EditJobPage";
import ErrorPage from "./pages/ErrorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Auth, data, feedback
import AuthProvider from "./auth/AuthProvider";
import RequireRole from "./components/RequireRole";
import AppErrorBoundary from "./components/AppErrorBoundary";
import ToastProvider from "./toast/ToastProvider";
import { queryClient } from "./lib/queryClient";

// Loaders
import { jobLoader } from "./loaders/jobLoader";

// Seeker-only pages, split into their own chunks.
const loadTrackerPage = async () => {
  const { default: TrackerPage } = await import("./pages/TrackerPage");
  return { element: <RequireRole role="SEEKER"><TrackerPage/></RequireRole> };
};

// Create Router. Every route has its own errorElement, so an error in one
// page renders inside the layout (navbar still works); the root one catches
// errors in the layout itself.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout/>} errorElement={<ErrorPage/>}>
      <Route index element={<HomePage/> } errorElement={<ErrorPage/>}/>
      <Route path="/jobs" element={<JobsPage/> } errorElement={<ErrorPage/>}/>
      <Route path="/jobs/:id" element={<JobPage/> } loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="/add-job" element={<RequireRole role="EMPLOYER"><AddJobPage/></RequireRole>} errorElement={<ErrorPage/>}/>
      <Route path="/edit-job/:id" element={<RequireRole role="EMPLOYER"><EditJobPage/></RequireRole>} loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="/login" element={<LoginPage/> } errorElement={<ErrorPage/>}/>
      <Route path="/register" element={<RegisterPage/> } errorElement={<ErrorPage/>}/>
      {/* Loaded on demand: dnd-kit stays out of the main bundle. */}
      <Route path="/tracker" lazy={loadTrackerPage} errorElement={<ErrorPage/>}/>
      <Route path="*" element={<NotFoundPage/> }/>
    </Route>
  )
);

const App = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App
