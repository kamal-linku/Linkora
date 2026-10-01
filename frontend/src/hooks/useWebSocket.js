import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

export const useWebSocket = () => {
  const { isConnected } = useContext(ChatContext);
  return { isConnected };
};
