import type { CSSProperties } from "react";
import ClipLoader  from "react-spinners/ClipLoader";

const override: CSSProperties = {
  display: "block",
  margin: "100px auto",
};

type SpinnerProps = {
  loading: boolean;
};

const Spinner = ({loading}: SpinnerProps) => {
  return (
    < ClipLoader
        color="#4338ca"
        loading={loading}
        size={150}
        cssOverride={override}
    />
  )
}

export default Spinner