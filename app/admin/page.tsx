"use client";
import React, { useState, useEffect } from "react";
import { auth, db, getDocs, collection, doc, getDoc, updateDoc } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const UserTable = () => {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin?: boolean; // Flag para superadmin
  }


  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // Verificar se é administrador
  const [currentUserId, setCurrentUserId] = useState<string>(""); // ID do usuário logado
  const router = useRouter();

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUserId(user.uid); // Armazena o ID do usuário atual

            // Obter dados do Firestore
            const userDoc = doc(collection(db, "users"), user.uid);
            const userSnapshot = await getDoc(userDoc);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              setIsAdmin(userData.role === "adm");
            } else {
              console.error("Usuário não encontrado no Firestore.");
            }
          } else {
            router.push("/login"); // Redirecionar se não estiver logado
          }
        });
      } catch (error) {
        console.error("Erro ao verificar a role do usuário:", error);
      }
    };

    checkAdminRole();
  }, [router]);

  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));

        const userList: User[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.username || "N/A",
            email: data.email || "N/A",
            role: data.role || "Aluno",
            isSuperAdmin: data.isSuperAdmin || false, // Inclui flag para superadmin
          };
        });

        setUsers(userList);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Atualiza localmente o estado para feedback imediato
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
  
      // Atualiza no Firestore
      const userDoc = doc(db, "users", userId); // Referência ao documento
      await updateDoc(userDoc, { role: newRole }); // Salva a nova role
      console.log("Função atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar a função do usuário:", error);
    }
  };
  
  const saveAllChanges = async () => {
    try {
      const updates = users.map((user) => {
        const userDoc = doc(db, "users", user.id);
        return updateDoc(userDoc, { role: user.role });
      });
  
      await Promise.all(updates); // Aguarda todas as atualizações
      alert("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto text-center">
        <p className="text-xl text-red-500">Acesso negado. Você não é um administrador.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <div className="container mx-auto">
        <div className="flex w-full justify-center h-24 items-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Usuários</h1>
        </div>
        <div className="bg-black shadow-md rounded-lg p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-white">ID</th>
                <th className="px-4 py-2 text-left text-white">Nome</th>
                <th className="px-4 py-2 text-left text-white">Email</th>
                <th className="px-4 py-2 text-left text-white">Role</th>
                <th className="px-4 py-2 text-left text-white">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-2 text-white">{user.id}</td>
                  <td className="px-4 py-2 text-white">{user.name}</td>
                  <td className="px-4 py-2 text-white">{user.email}</td>
                  <td className="px-4 py-2 text-white">{user.role}</td>
                  <td className="px-4 py-2 text-white">
                    {user.isSuperAdmin ? (
                      <span className="text-gray-500">Superadmin</span> // Bloquear alteração do superadmin
                    ) : (
                      <select
                        className="border rounded p-2 bg-black text-white"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUserId} // Bloquear alterações no próprio usuário
                      >
                        <option value="Aluno">Aluno</option>
                        <option value="Professor">Professor</option>
                        <option value="adm">Administrador</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-10 w-full flex justify-end">
            <button
              className="w-20 h-10 rounded-lg bg-white text-black"
              onClick={saveAllChanges}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
