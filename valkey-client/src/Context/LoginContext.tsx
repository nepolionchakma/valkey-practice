import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
interface IUserSocketTypes {
  [key: string]: string[];
}
interface IAuthContextProviderProps {
  children: React.ReactNode;
}

interface IAuthContextTypes {
  user: string | null;
  login: (username: string) => void;
  handleLogOut: () => void;
  socket: Socket;
  wlc: string | undefined;
  users: IUserSocketTypes;
  chat: IChatTypes;
}
interface IChatTypes {
  [key: string]: string[];
}

// Create a context
const AuthContext = createContext<IAuthContextTypes | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Consumer not found");
  }
  return context;
};

export const AuthContextProvider: React.FC<IAuthContextProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<string | "">(() => {
    const name = localStorage.getItem("userName");
    return name ? JSON.parse(name) : "";
  });
  const url = import.meta.env.VITE_API_URL;
  const [users, setUsers] = useState<IUserSocketTypes>({});
  const [chat, setChat] = useState<IChatTypes>({});
  const [wlc, setWlc] = useState<string | undefined>(undefined);
  console.log(chat, "chat");
  const socket = io(url, {
    query: {
      username: user,
    },
  });
  // const handleUsers = (data?: IUserSocketTypes[]) => {
  //   //i dont want store user if user same
  //   if (data) {
  //     setUsers(data.filter((data) => data !== user));
  //   }
  //   // setUsers((prev) => prev.filter((userPrev) => userPrev.username !== user));
  // };

  const handleUsers = (data?: IUserSocketTypes) => {
    if (data) {
      const filteredUsers = { ...data };
      delete filteredUsers[user!]; // Filter out the current user
      setUsers(filteredUsers);
    }
  };

  console.log(users, "users");
  useEffect(() => {
    socket.on("onlineUsers", (data) => {
      handleUsers(data);
      console.log("check", data);
    });
    socket.on(
      "receiveNotification",
      (data: { reciverName: string; msg: string }) => {
        setChat((prev) => {
          // Create a new state object based on the previous state
          const updatedChat = { ...prev };

          // Initialize the receiver's chat if it doesn't exist
          if (!updatedChat[data.reciverName]) {
            updatedChat[data.reciverName] = [];
          }

          // Add the new message to the appropriate receiver's chat
          updatedChat[data.reciverName].push(data.msg);

          return updatedChat; // Return the updated state
        });
      }
    );

    socket.on("welcome", (data: string) => {
      setWlc(data); // Set welcome message
    });

    // Cleanup function to remove the listener
    return () => {
      socket.off("onlineUsers");
      socket.off("receiveNotification");
      socket.off("welcome");
    };
  }, [users.length, url, user]);
  console.log(users, "users in context");
  const login = (username: string) => {
    setUser(username);
    localStorage.setItem("userName", JSON.stringify(username));
  };

  const handleLogOut = () => {
    localStorage.removeItem("userName");
    setUser("");
    socket.disconnect();
  };

  const value = { user, login, handleLogOut, socket, wlc, users, chat };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
