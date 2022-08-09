import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const SocketContext = createContext<Socket | undefined>(undefined);

export function useSocket() {
    return useContext(SocketContext);
}

export default function SocketProvider({ children }: any) {
    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('connected: ' + newSocket.id);
        });
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}