import { IUserSocketTypes } from "@/Pages/Chat/Chat";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IAuthContextProviderProps {
  children: React.ReactNode;
}

interface IAuthContextTypes {
  user: string | null;
  login: (username: string) => void;
  handleLogOut: () => void;
  socket: Socket;
  wlc: string | undefined;
  users: IUserSocketTypes[];
  chat: string[];
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
  const [users, setUsers] = useState<IUserSocketTypes[]>([]);
  const [chat, setChat] = useState<string[]>([]);
  const [wlc, setWlc] = useState<string | undefined>(undefined);

  const socket = io("http://localhost:3000", {
    query: {
      username: user,
    },
  });
  const handleUsers = (data?: IUserSocketTypes[]) => {
    //i dont want store user if user same
    if (data) {
      setUsers(data.filter((data) => data.username !== user));
    }
    // setUsers((prev) => prev.filter((userPrev) => userPrev.username !== user));
  };
  console.log(users, "users");
  useEffect(() => {
    socket.on("onlineUsers", (data) => {
      handleUsers(data);
      console.log("check", data);
    });
    socket.on("receiveNotification", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("welcome", (data: string) => {
      setWlc(data); // Set welcome message
    });

    // Cleanup function to remove the listener
    return () => {
      socket.off("onlineUsers");
      socket.off("receiveNotification");
      socket.off("welcome");
    };
  }, [users.length, user]);
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
