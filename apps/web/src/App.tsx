// Router
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider} from "react-router-dom";

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

// Auth
import AuthProvider from "./auth/AuthProvider";
import RequireRole from "./components/RequireRole";

// Loaders
import { jobLoader } from "./loaders/jobLoader";

// Create Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout/>} errorElement={<ErrorPage/>}>
      <Route index element={<HomePage/> }/>
      <Route path="/jobs" element={<JobsPage/> }/>
      <Route path="/jobs/:id" element={<JobPage/> } loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="/add-job" element={<RequireRole role="EMPLOYER"><AddJobPage/></RequireRole>}/>
      <Route path="/edit-job/:id" element={<RequireRole role="EMPLOYER"><EditJobPage/></RequireRole>} loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="/login" element={<LoginPage/> }/>
      <Route path="/register" element={<RegisterPage/> }/>
      <Route path="*" element={<NotFoundPage/> }/>
    </Route>
  )
);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App