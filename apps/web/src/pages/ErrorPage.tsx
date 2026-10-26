import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom"
import { FaExclamationTriangle } from "react-icons/fa"

// errorElement for every route: loader errors (e.g. a 404 job) and render
// errors in a page show here, inside the layout, without taking down the app.
function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  console.error(error);

  return (
    <section className="text-center flex flex-col justify-center items-center min-h-96 py-12 px-4">
      <FaExclamationTriangle className="text-yellow-400 text-6xl mb-4" />
      <h1 className="text-4xl sm:text-6xl font-bold mb-4">
        {notFound ? "Job Not Found" : "Something Went Wrong"}
      </h1>
      <p className="text-xl mb-5">
        {notFound
          ? "This job does not exist or has been deleted"
          : "We could not load this page. Please try again later"}
      </p>
      <Link
        to="/jobs"
        className="text-white bg-indigo-700 hover:bg-indigo-900 rounded-md px-3 py-2 mt-4"
        >Back to Jobs</Link>
    </section>
  )
}

export default ErrorPage
