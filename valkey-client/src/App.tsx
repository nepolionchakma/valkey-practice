import "./App.css";
import { useEffect, useState } from "react";
import { useAuthContext } from "./Context/LoginContext";
import LogIn from "./Pages/LogIn/LogIn";
import Chat, { IUserSocketTypes } from "./Pages/Chat/Chat";
export interface IChatTypes {
  senderName: string;
  reciverName: IUserSocketTypes;
  msg: string;
}

function App() {
  const { user, socket } = useAuthContext();
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<IChatTypes[]>([]);
  useEffect(() => {
    socket.emit("user", user);
  }, [user, null]);
  useEffect(() => {
    socket.emit("chat", chat);
  }, [message]);

  return user ? (
    <>
      <Chat
        chat={chat}
        setChat={setChat}
        message={message}
        setMessage={setMessage}
      />
    </>
  ) : (
    <LogIn />
  );
}

export default App;
