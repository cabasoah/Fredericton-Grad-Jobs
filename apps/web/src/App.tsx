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

// Loaders
import { jobLoader } from "./loaders/jobLoader";

// Create Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout/>} errorElement={<ErrorPage/>}>
      <Route index element={<HomePage/> }/>
      <Route path="/jobs" element={<JobsPage/> }/>
      <Route path="/jobs/:id" element={<JobPage/> } loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="/add-job" element={<AddJobPage/> }/>
      <Route path="/edit-job/:id" element={<EditJobPage/> } loader = {jobLoader} errorElement={<ErrorPage/>}/>
      <Route path="*" element={<NotFoundPage/> }/>
    </Route>
  )
);

const App = () => {
  return <RouterProvider router={router} />;
  
}

export default App