import { useState, useEffect, useRef } from "react";
import { auth, db, collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, deleteDoc, doc, getDoc } from "../../firebase/firebase";
import { Timestamp } from "firebase/firestore";

// Definindo o tipo Message
type Message = {
  id: string;
  senderUid: string;
  sender: string;
  content: string;
  photoURL: string;
  timestamp: Timestamp;
};

type MessageProps = {
  photoURL: any;
  text: string;
  messageId: string;
  onDelete: (id: string) => void;
  senderUid: string;
  userRole: string;
  userId: string;
};



const isValidUrl = (text: string) => {
  const urlRegex = /https?:\/\/(www\.)?[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+/;
  return urlRegex.test(text);
};


export const ReceivedMessage = ({
  photoURL,
  text,
  messageId,
  onDelete,
  senderUid,
  userRole,
  userId,
}: MessageProps) => {
  const canDelete = userId === senderUid || userRole === "Professor";

  return (
    <div className="flex w-full justify-start mb-1">
      <div className="flex w-max gap-4">
        <div className="flex flex-row gap-1 items-center">
          <img src={photoURL} alt="" className="rounded-full" style={{ width: 30, height: 30 }} />
          <div className="bg-[rgb(247,77,233)] text-white rounded-e-3xl p-2">
            <div className="text-white p-3 max-w-md whitespace-pre-wrap break-words">
              {isValidUrl(text) ? (
                <a
                  href={text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 underline hover:text-blue-500"
                >
                  {text}
                </a>
              ) : (
                <span>{text}</span>
              )}
            </div>
          </div>
          {canDelete && (
            <button onClick={() => onDelete(messageId)}>
              <img src="/trash.svg" alt="" style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SentMessage = ({
  photoURL,
  text,
  messageId,
  onDelete,
  senderUid,
  userRole,
  userId,
}: MessageProps) => {
  const canDelete = userId === senderUid || userRole === "Professor";

  return (
    <div className="flex w-full justify-end mb-1">
      <div className="flex w-max gap-4">
        <div className="flex flex-row-reverse gap-1 items-center">
          <img src={photoURL} alt="" className="rounded-full" style={{ width: 30, height: 30 }} />
          <div className="bg-[rgb(105,52,184)] text-white rounded-s-3xl p-2">
            <div className="text-white p-3 max-w-md whitespace-pre-wrap break-words">
              {isValidUrl(text) ? (
                <div>
                  <p>atividade:</p>
                  <div className="bg-[rgba(56,42,136,0.47)] text-white rounded-s-3xl p-2">
                    <a
                      href={text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline hover:text-blue-500"
                    >
                      {text}
                    </a>
                  </div>
                </div>
              ) : (
                <span>{text}</span>
              )}
            </div>
          </div>
          {canDelete && (
            <button onClick={() => onDelete(messageId)}>
              <img src="/trash.svg" alt="" style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};




export default function MessageItem({ user, chatId }: any) {
  const [userInfo, setUserInfo] = useState<{ username: string; description: string; role: string }>({ username: "", description: "", role: "" });
  const [messages, setMessages] = useState<Message[]>([]); // Alterado para Message[]
  const [newMessage, setNewMessage] = useState("");
  const [lastLoadedTimestamp, setLastLoadedTimestamp] = useState<Date | null>(null);
  const notifiedMessages = useRef(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [activityLink, setActivityLink] = useState("");

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

    const fetchMessages = async () => {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          senderUid: doc.data().senderUid,
          sender: doc.data().sender,
          content: doc.data().content,
          photoURL: doc.data().photoURL,
          timestamp: doc.data().timestamp as Timestamp,
        }));


        setMessages(newMessages);

        if (newMessages.length > 0) {
          setLastLoadedTimestamp(newMessages[newMessages.length - 1].timestamp?.toDate());
        }
      });

      return unsubscribe;
    };

    fetchUserInfo();
    fetchMessages();
    requestNotificationPermission();

    if (!lastLoadedTimestamp) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("timestamp", ">", lastLoadedTimestamp),
      orderBy("timestamp", "asc")
    );



    const unsubscribeNewMessages = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const { sender, content, timestamp, senderUid } = change.doc.data();
          const messageId = change.doc.id;

          if (senderUid !== user.id && !notifiedMessages.current.has(messageId)) {
            notifiedMessages.current.add(messageId);
            showNotification(`Nova mensagem de ${sender}`, content, "/path/to/icon.png");
          }

          setMessages((prevMessages) => [
            ...prevMessages,
            { id: messageId, sender, content, timestamp, senderUid, photoURL: change.doc.data().photoURL },
          ]);
        }
      });
    });

    return () => unsubscribeNewMessages();


  }, [chatId, lastLoadedTimestamp, user.id]);

  async function requestNotificationPermission() {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Permissão de notificação concedida");
      } else {
        console.warn("Permissão de notificação negada");
      }
    }
  }

  function showNotification(title: string, message: string, iconUrl: string) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: iconUrl,
      });
    }
  }

  const sendMessage = async (content: string) => {
    if (content.trim() === "") return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        content,
        senderUid: user?.id,
        sender: user?.displayName || userInfo.username,
        photoURL: user?.avatar || "",
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleSendActivity = () => {
    if (activityLink.trim() !== "") {
      sendMessage(`${activityLink}`);
      setActivityLink("");
      setShowDropdown(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Busca a mensagem no Firestore
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        console.error("Mensagem não encontrada.");
        return;
      }

      const messageData = messageSnap.data();
      const senderUid = messageData?.senderUid;

      // Verifica se o usuário tem permissão para excluir
      if (user?.id === senderUid || userInfo.role === "Professor") {
        await deleteDoc(messageRef);
        console.log("Mensagem excluída com sucesso.");
      } else {
        console.error("Você não tem permissão para excluir esta mensagem.");
      }
    } catch (error) {
      console.error("Erro ao excluir a mensagem:", error);
    }
  };

  return (
    <>
      <div className="chat w-full h-full flex flex-col justify-between">
        <div className="messages w-full flex-1 overflow-y-scroll scrollbar pt-24 p-4">
          {messages.map((message) => (
            message.senderUid === user?.id ? (
              <SentMessage
                key={message.id}
                messageId={message.id}
                text={message.content}
                photoURL={message.photoURL || user.avatar}
                senderUid={message.senderUid}
                userRole={userInfo.role}
                userId={user?.id}
                onDelete={handleDeleteMessage}
              />

            ) : (
              <ReceivedMessage
                key={message.id}
                messageId={message.id}
                text={message.content}
                photoURL={message.photoURL || "/Guest.png"}
                senderUid={message.senderUid}
                userRole={userInfo.role}
                userId={user?.id}
                onDelete={handleDeleteMessage}
              />
            )
          ))}
        </div>

        <div className="new-message w-full flex items-center justify-center gap-2 bg-[#3E2878] h-[3rem] px-4 rounded-lg">
          <div className="relative">
            {/* Ícone de clipe */}
            <img
              src="/anexo.svg"
              alt="clipe"
              width={20}
              height={20}
              onClick={toggleDropdown}
              className="cursor-pointer"
            />
            {showDropdown && (
              <div className="dropdown absolute bg-[#3E2878] shadow-lg p-2 rounded-md bottom-10 left-0 z-10 w-64">
                <h4 className="text-white text-sm font-bold">Enviar Atividade</h4>
                <input
                  type="text"
                  placeholder="Cole o link da atividade"
                  value={activityLink}
                  onChange={(e) => setActivityLink(e.target.value)}
                  className="border bg-[#3E2878] w-full p-1 rounded-md mb-2"
                />
                <button
                  onClick={handleSendActivity}
                  className="bg-[#501ADD] text-white py-1 px-2 rounded-md hover:bg-[#6934b8]"
                >
                  Enviar
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreva sua mensagem"
            className="input-message w-full bg-transparent outline-none text-white h-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage(newMessage);
            }}
          />
          <button onClick={() => sendMessage(newMessage)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#501ADD] text-white">
            <img src="/send.svg" alt="send" width={20} height={20} />
          </button>
        </div>
      </div>
    </>
  );
}
