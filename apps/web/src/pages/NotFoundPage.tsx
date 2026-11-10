import { LuCompass } from "react-icons/lu"
import StatusCard from "@/components/StatusCard"

function NotFoundPage() {
  return (
    <StatusCard
      icon={<LuCompass aria-hidden />}
      label="Error 404"
      title="This page doesn't exist"
      message="The link may be mistyped, or the job it pointed to may have closed or been removed."
    />
  )
}

export default NotFoundPage
