import { IChatTypes } from "@/App";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/Context/LoginContext";
import { Dispatch, FC, SetStateAction, useState } from "react";
export interface IUserSocketTypes {
  [key: string]: string[];
}
interface IChatProps {
  setChat: Dispatch<SetStateAction<IChatTypes[]>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
}
const Chat: FC<IChatProps> = ({ message, setMessage }) => {
  const { chat, user, handleLogOut, wlc, socket, users } = useAuthContext();
  const [reciverName, setReciverName] = useState<string[]>([]);

  console.log(reciverName, "reciverName");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReciverName((prev) => {
      if (prev?.includes(e.target.value)) {
        return prev.filter((item) => item !== e.target.value);
      } else {
        return [...prev, e.target.value];
      }
    });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    handleNotification(message);
    setMessage("");
  };
  console.log(user, "user");

  const handleNotification = (msg: string) => {
    socket.emit("sendNotification", {
      senderName: user,
      reciverName: reciverName,
      msg,
    });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-row-reverse items-center">
        <button
          onClick={handleLogOut}
          className="border p-1 rounded bg-red-500"
        >
          LogOut
        </button>
        <div className="underline">User Name : {user}</div>
      </div>
      <div className="flex flex-col gap-2 justify-center items-center p-2">
        {wlc}
        <div className="h-36 w-72 rounded overflow-y-auto border-slate-500 border flex gap-2  flex-col">
          {Object.keys(chat).map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <p>
                <span className="font-bold">
                  From :{" "}
                  {item === user &&
                    chat[item].map((item, i) => <p key={i}>{item}</p>)}
                </span>{" "}
              </p>
            </div>
          ))}
        </div>
        <div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <select name="reciverName" onChange={handleSelectChange}>
              <option>select option</option>
              {Object.keys(users).map((username) => {
                console.log(username, "username");
                return (
                  <option key={username} value={username}>
                    {username}
                  </option>
                );
              })}
            </select>
            <input
              name="msg"
              type="text"
              value={message}
              onChange={handleChange}
              placeholder="message"
              className="border p-1 rounded"
            />
            <Button className="bg-slate-400" type="submit">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Chat;
