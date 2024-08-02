import Chat from './components/chat/Chat';
import List from './components/list/List';
import Detail from './components/details/Detail';
import Login from './components/login/Login';
import Notification from './components/notification/Notification';
import { useEffect, useCallback } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from './lib/userStore';
import { useChatStore } from './lib/chatStore';

const App = () => {
  const { chatId } = useChatStore();
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();

  // Memoize fetchUserInfo to ensure it doesn't change between renders
  // const fetchUser = useCallback(fetchUserInfo, [fetchUserInfo]);

  useEffect(() => {
    console.log('Setting up auth state listener');
    // Listen for changes to the user's authentication state.
    const unSub = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      fetchUserInfo(user ? user.uid : null);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unSub();
    };
  }, [fetchUser]);

  console.log('Current User:', currentUser);
  console.log('Is Loading:', isLoading);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
