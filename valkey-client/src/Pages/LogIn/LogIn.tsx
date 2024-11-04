import { useState } from "react";
import { useAuthContext } from "../../Context/LoginContext";

const LogIn = () => {
  const { login } = useAuthContext();
  const [userName, setUserName] = useState<string>("");
  const handleSubmit = () => {
    login(userName);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };
  return (
    <>
      <form action="" onSubmit={handleSubmit} className="flex gap-2">
        <input type="text" onChange={handleChange} className="border" />
        <button type="submit" className="border p-1 rounded bg-slate-200">
          LogIn
        </button>
      </form>
    </>
  );
};
export default LogIn;
