import { isRouteErrorResponse, useRouteError } from "react-router-dom"
import { LuCompass, LuTriangleAlert } from "react-icons/lu"
import StatusCard from "@/components/StatusCard"

// errorElement for every route: loader errors (e.g. a 404 job) and render
// errors in a page show here, inside the layout, without taking down the app.
function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  console.error(error);

  return notFound ? (
    <StatusCard
      icon={<LuCompass aria-hidden />}
      label="Error 404"
      title="Job not found"
      message="This job does not exist or has been deleted."
    />
  ) : (
    <StatusCard
      icon={<LuTriangleAlert aria-hidden />}
      label="Error"
      title="Something went wrong"
      message="We could not load this page. Please try again later."
    />
  )
}

export default ErrorPage
