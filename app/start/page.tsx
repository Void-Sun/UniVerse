'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { auth, db, collection, doc, onSnapshot, getDoc } from '../../firebase/firebase'
import Chat from '../components/chat';
import ChatIntro from "../components/chatintro";
import Modal from "../components/newchat";
import Perfil from "../components/perfil";
import InfoModal from "../components/infochat";
import MessageItem from "../components/messageitem";
import SettingsModal from "../components/config";

const Chatroom = ({ user, chatId, onClose }: any) => {

    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [chatInfo, setChatInfo] = useState<{ name: string }>({ name: "" });
    const [list, setList] = useState([{}]);

    const openInfoModal = (chatId: string) => {
        setSelectedChatId(chatId);
        setInfoModalOpen(true);
    };

    const closeInfoModal = () => setInfoModalOpen(false);

    useEffect(() => {
        if (!chatId) {
            console.error("Chat ID não definido.");
            return;
        }

        const fetchChatInfo = async () => {
            try {
                const chatRef = doc(db, "chats", chatId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    setChatInfo(chatSnap.data() as { name: string; });
                }
            } catch (error) {
                console.error("Erro ao buscar informações do chat:", error);
            }
        };

        fetchChatInfo();
    }, [chatId]);

    return (
        <>
            <div className="conversa flex justify-center w-full ">
                <div className="bg-[#1E0D4A] dark:bg-[#342755] rounded-[2rem] w-[70vw] mt-3 h-[5rem] flex justify-between items-center p-4 fixed top-0 z-50">
                    <button onClick={onClose}> {/* Chama a função para fechar o chat */}
                        <Image src='/back.svg' alt='back' width={45} height={45} />
                    </button>
                    <div className="flex gap-2 items-center">
                        <Image src='/image.png' alt='back' width={35} height={35} />
                        <h1 className="text-white text-2xl">{chatInfo.name}</h1>
                    </div>
                    <button
                        className="m-1"
                        onClick={() => openInfoModal(chatId)}
                    >
                        <Image src='/more.svg' alt='more' width={30} height={30} />
                    </button>

                    {selectedChatId && (
                        <InfoModal
                            isOpen={infoModalOpen}
                            onClose={closeInfoModal}
                            chatId={selectedChatId}
                        />
                    )}
                </div>
            </div>

            {list.map((item, key) => (
                <MessageItem
                    key={key}
                    data={item}
                    user={user}
                    chatId={chatId}
                />
            ))}
        </>
    );
}

export default function Home() {
    interface ChatData {
        id: string;
        name: string;
        description: string;
        // Adicione outros campos conforme necessário
    }

    const [userInfo, setUserInfo] = useState<{ username: string; description: string; role: string }>({ username: "", description: "", role: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const [openProfile, setOpenProfile] = useState(false);
    const openProfileModal = () => setOpenProfile(true);
    const closeProfileModal = () => setOpenProfile(false);

    const [chats, setChats] = useState<ChatData[]>([]);
    const [filteredChats, setFilteredChats] = useState<ChatData[]>([]); // Para exibir os resultados filtrados
    const [searchTerm, setSearchTerm] = useState("");
    const [activeChat, setActiveChat] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "chats"), (snapshot) => {
            const chatData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<ChatData, "id">), // Garante o tipo correto
            }));
            setChats(chatData);
            setFilteredChats(chatData);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!auth.currentUser) {
                console.error("Nenhum usuário autenticado");
                return;
            }

            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data() as { username: string; description: string; role: string };
                    setUserInfo(userData);
                } else {
                    console.error("Documento do usuário não encontrado no Firestore");
                }
            } catch (error) {
                console.error("Erro ao buscar informações do usuário:", error);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                const userData = {
                    id: currentUser.uid,
                    displayName: currentUser.displayName,
                    avatar: currentUser.photoURL,
                    email: currentUser.email,
                };
                setUser(userData);
                fetchUserInfo();
            } else {
                console.error("Usuário não autenticado");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);

        // Filtrar a lista com base no termo digitado
        const results = chats.filter(chat =>
            chat.name.toLowerCase().includes(term) || chat.description.toLowerCase().includes(term)
        );
        setFilteredChats(results);
    };

    const Createchat = () => {
        return (
            <>
                <button onClick={openModal} className="m-1">
                    <Image src="/chat.svg" alt="logo" width={20} height={20} />
                </button>
                <Modal isOpen={isModalOpen} onClose={closeModal} />
            </>
        );
    };

    const handleChatClose = () => {
        setActiveChat(null); // Resetando o chat ativo quando fechado
    };

    return (
        <>
            <div className="flex w-full h-full bg-[#0D081A] dark:bg-[#6b4cba]">
                <div className="flex h-screen bg-[#0D081A] dark:bg-[#6b4cba]">
                    <div className="flex justify-center h-full w-[21rem] p-6">
                        <div className="w-full h-full rounded-[3rem] bg-[#1E0D4A] dark:bg-[#483083] flex flex-col">
                            <div className="flex items-center my-3 justify-center w-full h-[3rem] gap-1">
                                <Image src="/image.png" alt="logo" width={50} height={50} />
                                <p className="text-white text-2xl font-bold p-4">UniVerse</p>
                            </div>

                            <div className="flex w-full h-[4rem] items-center justify-center bg-[#10003A]   dark:bg-[#342755] ">
                                <div className="flex items-center justify-center rounded-full w-full h-[2rem] m-2 bg-[#382270] text-white">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="bg-transparent m-2 text-white outline-none"
                                        placeholder="Buscar Matéria"
                                    />
                                </div>
                                <div className="flex h-full items-end justify-end">
                                    {userInfo.role === "Professor" && <Createchat />}
                                </div>
                            </div>

                            <div className="scrollbar bg-[#2C1B39] dark:bg-[#8f6bab] overflow-y-scroll flex-1">
                                <div className="h-full">
                                    {chats.map((chat) => (
                                        <Chat
                                            //@ts-ignore
                                            key={chat.id}
                                            //@ts-ignore
                                            data={{ title: chat.name, image: "/image.png", description: chat.description }}
                                            //@ts-ignore
                                            active={activeChat?.id === chat.id}
                                            onClick={() => setActiveChat(chat)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex w-full items-center h-[6rem] justify-center p-4">
                                <div>
                                    {user ? (
                                        <div>
                                            <div className="flex items-center gap-2 w-full h-[4rem] justify-between">
                                                <div className="flex items-center gap-2 w-full h-full cursor-pointer" onClick={openProfileModal}>
                                                    <img
                                                        src={user.avatar || "/Guest.png"}
                                                        alt={`${user.displayName}'s avatar`}
                                                        className="w-12 h-12 rounded-full"
                                                    />
                                                    <div className="w-full">
                                                        <p className="text-white text-lg">{userInfo.username || user?.displayName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex h-full w-[5rem] items-center justify-center">
                                                    <button>
                                                        <Image onClick={() => setIsSettingsOpen(true)} src="/config.svg" alt="logo" width={30} height={30} />
                                                    </button>
                                                    <Perfil Open={openProfile} Close={closeProfileModal} />
                                                    <SettingsModal
                                                        isOpen={isSettingsOpen}
                                                        onClose={() => setIsSettingsOpen(false)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white">Nenhum usuário autenticado</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-full p-6 bg-[#0D081A] dark:bg-[#3E2878]">
                    {activeChat ? (
                        <Chatroom user={user} chatId={activeChat.id} onClose={handleChatClose} /> // Passando a função de fechar
                    ) : (
                        <ChatIntro />
                    )}
                </div>
            </div>
        </>
    );
}
