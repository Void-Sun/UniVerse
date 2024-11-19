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
};



export const ReceivedMessage = ({ photoURL, text, messageId, onDelete, senderUid, userRole, userId }: MessageProps & { senderUid: string; userRole: string; userId: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const characterLimit = 300;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const canDelete = userId === senderUid || userRole === "Professor";

  return (
    <div className='flex w-full justify-start mb-1'>
      <div className='flex w-max gap-4'>
        <div className='flex flex-row gap-1 items-center'>
          <img src={photoURL} alt="" className="rounded-full" style={{ width: 30, height: 30 }} />
          <div className='bg-[rgb(247,77,233)] text-white rounded-e-3xl p-2'>
            <div className="text-white p-3 max-w-md whitespace-pre-wrap break-words">
              {isExpanded || text.length <= characterLimit ? (
                <span>{text}</span>
              ) : (
                <span>{text.slice(0, characterLimit)}...</span>
              )}
              {text.length > characterLimit && (
                <button
                  onClick={toggleExpand}
                  className="text-sm text-blue-200  ml-2 hover:text-pink-500"
                >
                  {isExpanded ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </div>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(messageId)}
            >
              <img src="/trash.svg" alt="" style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// Componente para mensagens enviadas
export const SentMessage = ({ photoURL, text, messageId, onDelete, senderUid, userRole, userId }: MessageProps & { senderUid: string; userRole: string; userId: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const characterLimit = 300;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const canDelete = userId === senderUid || userRole === "professor";

  return (
    <div className='flex w-full justify-end mb-1'>
      <div className='flex w-max gap-4'>
        <div className='flex flex-row-reverse gap-1 items-center'>
          <img src={photoURL || './Guest.png'} alt="" className="rounded-full" style={{ width: 30, height: 30 }} />
          <div className='bg-[rgb(105,52,184)] text-white rounded-s-3xl p-2'>
            <div className="text-white p-3 max-w-md whitespace-pre-wrap break-words">
              {isExpanded || text.length <= characterLimit ? (
                <span>{text}</span>
              ) : (
                <span>{text.slice(0, characterLimit)}...</span>
              )}
              {text.length > characterLimit && (
                <button
                  onClick={toggleExpand}
                  className="text-sm text-blue-200  ml-2 hover:text-pink-500"
                >
                  {isExpanded ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </div>
          </div>
          <div>
            {canDelete && (
              <button
                onClick={() => onDelete(messageId)}
                className="text-sm text-red-500 underline ml-2 hover:text-red-700"
              >
                <img src="/trash.svg" alt="" style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>
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

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        content: newMessage,
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
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreva sua mensagem"
            className="input-message w-full bg-transparent outline-none text-white h-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button onClick={sendMessage} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#501ADD] text-white">
            <img src="/send.svg" alt="send" width={20} height={20} />
          </button>
        </div>
      </div>
    </>
  );
}
