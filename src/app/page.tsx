'use client';

import Dashboard from '@/components/Dashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 客户端渲染，不等待服务端数据
export default function Home() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Dashboard />
    </GoogleOAuthProvider>
  );
}
