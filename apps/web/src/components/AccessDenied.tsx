import { LuLock } from "react-icons/lu"
import StatusCard from "./StatusCard"

type AccessDeniedProps = {
  message: string;
}

const AccessDenied = ({ message }: AccessDeniedProps) => {
  return <StatusCard icon={<LuLock aria-hidden />} label="Restricted" title="Not allowed" message={message} />
}

export default AccessDenied
