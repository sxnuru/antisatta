'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Coins, User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-border h-14 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center -ml-2">
          <img src="/imgs/Anti Satta.png" alt="Anti Satta" className="w-32 md:w-40 object-contain" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
              <Coins className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold text-sm">{user.balance.toLocaleString()}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors"
              >
                <span className="font-semibold text-xs">{user.username.charAt(0).toUpperCase()}</span>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-semibold truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors w-full"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              href="/auth/login" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-primary text-primary-foreground text-sm font-semibold py-1.5 px-4 rounded-md hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
