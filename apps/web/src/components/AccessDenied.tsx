import { Link } from "react-router-dom"
import { FaLock } from "react-icons/fa"

type AccessDeniedProps = {
  message: string;
}

const AccessDenied = ({ message }: AccessDeniedProps) => {
  return (
    <section className="text-center flex flex-col justify-center items-center h-96 px-4">
      <FaLock className="text-indigo-500 text-6xl mb-4" />
      <h1 className="text-4xl font-bold mb-4">Not Allowed</h1>
      <p className="text-xl mb-5">{message}</p>
      <Link
        to="/jobs"
        className="text-white bg-indigo-700 hover:bg-indigo-900 rounded-md px-3 py-2 mt-4"
        >Back to Jobs</Link>
    </section>
  )
}

export default AccessDenied
