// Router
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider} from "react-router-dom";

// Pages
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import NotFoundPage from "./pages/NotFoundPage";
import JobPage, {JobLoader} from "./pages/JobPage";
import AddJobPage from "./pages/AddJobPage";
import EditJobPage from "./pages/EditJobPage";

// Create Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout/>}>
      <Route index element={<HomePage/> }/>
      <Route path="/jobs" element={<JobsPage/> }/>
      <Route path="/jobs/:id" element={<JobPage/> } loader = {JobLoader}/>
      <Route path="/add-job" element={<AddJobPage/> }/>
      <Route path="/edit-job/:id" element={<EditJobPage/> } loader = {JobLoader}/>
      <Route path="*" element={<NotFoundPage/> }/>
    </Route>
  )
);

const App = () => {
  return <RouterProvider router={router} />;
  
}

export default App