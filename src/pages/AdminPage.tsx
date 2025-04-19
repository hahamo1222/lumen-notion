import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminDashboard } from '../components/AdminDashboard';

export function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: adminConfig } = await supabase
        .from('admin_config')
        .select('email')
        .eq('email', user.email)
        .single();

      if (!adminConfig) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
    }

    checkAdminStatus();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <AdminDashboard />;
}