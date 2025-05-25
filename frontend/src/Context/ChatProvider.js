import { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedChat, setSelectedChat] = useState();
    const [chats, setChats] = useState([]);
    const [notification, setNotification] = useState([]);
    const history = useHistory();

    // Function to update user in both state and localStorage
    const setUserAndUpdate = (userData) => {
        if (userData) {
            localStorage.setItem("userInfo", JSON.stringify(userData));
        } else {
            localStorage.removeItem("userInfo");
        }
        setUser(userData);
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);

        if (!userInfo) {
            history.push("/");
        } else {
            // If user is logged in and on the home page, redirect to chats
            if (window.location.pathname === '/') {
                history.push('/chats');
            }
        }
    }, [history]);

    return (
        <ChatContext.Provider value={{ 
            user, 
            setUser: setUserAndUpdate, 
            selectedChat, 
            setSelectedChat, 
            chats, 
            setChats,
            notification,
            setNotification 
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const ChatState = () => {
    return useContext(ChatContext);
};

export default ChatProvider;
