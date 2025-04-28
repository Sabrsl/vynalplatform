"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Ce composant est accessible sans vérification d'admin
// Il est conçu pour déboguer et résoudre les problèmes d'accès admin
export default function AdminDebugPage() {
  const { profile, loading, isAdmin, getUserRole } = useUser();
  const { user } = useAuth();
  const [directRoleCheck, setDirectRoleCheck] = useState<string | null>(null);
  const [rpcResult, setRpcResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    // Vérifier directement le rôle via une requête SQL
    const checkRoleDirectly = async () => {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          setError(error.message);
        } else {
          setDirectRoleCheck(data?.role || 'non défini');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    // Tester l'appel RPC
    const testRpcCall = async () => {
      try {
        if (!user) return;
        
        const { data, error } = await supabase.rpc('get_user_role');
        
        if (error) {
          setRpcError(error.message);
        } else {
          setRpcResult(data || 'pas de résultat');
        }
      } catch (err: any) {
        setRpcError(err.message);
      }
    };
    
    // Récupérer les profils admin
    const loadProfiles = async () => {
      setProfilesLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'admin');
          
        if (error) {
          setError(error.message);
        } else {
          setUserProfiles(data || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProfilesLoading(false);
      }
    };
    
    checkRoleDirectly();
    testRpcCall();
    loadProfiles();
  }, [user, updateSuccess]);

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Débogage Admin</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <p>Vous n'êtes pas connecté. Veuillez vous connecter pour continuer.</p>
          <Link href="/auth/login" className="mt-2 inline-block text-blue-600 hover:underline">
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Débogage Admin</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  // Définir le compte comme admin
  const setUserAsAdmin = async () => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        setError(`Erreur lors de la mise à jour: ${error.message}`);
      } else {
        setUpdateSuccess(true);
        setError(null);
        alert('Rôle mis à jour avec succès en ADMIN. Veuillez rafraîchir la page.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Force test de la fonction RPC get_user_role
  const testRpcFunction = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        setRpcError(error.message);
      } else {
        setRpcResult(data || 'pas de résultat');
        setRpcError(null);
        alert(`Résultat RPC: ${data || 'pas de résultat'}`);
      }
    } catch (err: any) {
      setRpcError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Débogage Admin</h1>
      
      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md mb-6">
          <p className="font-medium">Rôle mis à jour avec succès!</p>
          <p>Votre compte a été défini comme administrateur. Si vous rencontrez toujours des problèmes d'accès, essayez de vous déconnecter et de vous reconnecter.</p>
          <div className="mt-2 flex gap-2">
            <Link href="/admin" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
              Aller à l'admin
            </Link>
            <Link href="/auth/logout" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm">
              Se déconnecter
            </Link>
          </div>
        </div>
      )}
      
      {/* Problèmes détectés */}
      {(!rpcResult || rpcResult !== 'admin' || !isAdmin || !directRoleCheck || directRoleCheck !== 'admin') && !updateSuccess && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <p className="font-medium">Problèmes détectés :</p>
          <ul className="list-disc pl-5 mt-2">
            {!rpcResult && <li>La fonction RPC get_user_role ne retourne pas de résultat</li>}
            {rpcResult && rpcResult !== 'admin' && <li>La fonction RPC retourne "{rpcResult}" au lieu de "admin"</li>}
            {!isAdmin && <li>Le hook useUser n'identifie pas l'utilisateur comme admin</li>}
            {!directRoleCheck && <li>Rôle non trouvé dans la vérification directe SQL</li>}
            {directRoleCheck && directRoleCheck !== 'admin' && <li>Rôle dans la base est "{directRoleCheck}" au lieu de "admin"</li>}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              onClick={setUserAsAdmin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Définir mon compte comme admin
            </button>
            <button 
              onClick={testRpcFunction}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Tester la fonction RPC
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white border rounded-md shadow mb-6 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Statut d'authentification</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="font-medium">Utilisateur connecté:</div>
          <div>{user ? 'Oui' : 'Non'}</div>
          
          <div className="font-medium">ID utilisateur:</div>
          <div className="font-mono text-sm">{user?.id || 'N/A'}</div>
          
          <div className="font-medium">Email:</div>
          <div>{user?.email || 'N/A'}</div>
          
          <div className="font-medium">Rôle (user_metadata):</div>
          <div className={`${user?.user_metadata?.role === 'admin' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {user?.user_metadata?.role || 'Non défini'}
          </div>
          
          <div className="font-medium">isAdmin (hook):</div>
          <div className={isAdmin ? 'text-green-600 font-medium' : 'text-red-600'}>
            {isAdmin ? 'Oui' : 'Non'}
          </div>
          
          <div className="font-medium">getUserRole():</div>
          <div className={`${getUserRole() === 'admin' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {getUserRole() || 'Non défini'}
          </div>
          
          <div className="font-medium">Profil rôle:</div>
          <div className={`${profile?.role === 'admin' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {profile?.role || 'Non défini'}
          </div>
          
          <div className="font-medium">Vérification directe (SQL):</div>
          <div className={`${directRoleCheck === 'admin' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {directRoleCheck || 'En cours...'}
          </div>
          
          <div className="font-medium">Résultat RPC get_user_role:</div>
          <div className={`${rpcResult === 'admin' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {rpcResult || 'En cours...'}
          </div>
          
          <div className="font-medium">Erreur SQL:</div>
          <div className="text-red-500">{error || 'Aucune'}</div>
          
          <div className="font-medium">Erreur RPC:</div>
          <div className="text-red-500">{rpcError || 'Aucune'}</div>
        </div>
      </div>
      
      <div className="bg-white border rounded-md shadow mb-6 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Utilisateurs admin dans la base de données</h2>
        </div>
        <div className="p-4">
          {profilesLoading ? (
            <p>Chargement des profils...</p>
          ) : userProfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 text-xs text-gray-600">ID</th>
                    <th className="text-left p-2 text-xs text-gray-600">Nom</th>
                    <th className="text-left p-2 text-xs text-gray-600">Email</th>
                    <th className="text-left p-2 text-xs text-gray-600">Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {userProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{profile.id}</td>
                      <td className="p-2">{profile.full_name || profile.username || 'N/A'}</td>
                      <td className="p-2">{profile.email || 'N/A'}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {profile.role || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
              <p>Aucun utilisateur admin trouvé dans la base de données.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white border rounded-md shadow overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Actions</h2>
        </div>
        <div className="p-4 space-y-4">
          <button 
            onClick={setUserAsAdmin}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2"
          >
            Définir mon compte comme admin
          </button>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={testRpcFunction}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Tester la fonction RPC
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Rafraîchir la page
            </button>
            
            <Link
              href="/admin"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Retour à l'admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 