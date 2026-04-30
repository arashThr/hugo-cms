"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, PenSquare } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <PenSquare className={styles.icon} />
          <span>Hugo CMS</span>
        </Link>
        
        <div className={styles.actions}>
          {status === "loading" ? (
            <div className={styles.skeleton}></div>
          ) : session ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{session.user?.name}</span>
              {session.user?.image && (
                <img src={session.user.image} alt="User" className={styles.avatar} />
              )}
              <button onClick={() => signOut()} className="button button-outline">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn("github")} className="button">
              Login with GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
