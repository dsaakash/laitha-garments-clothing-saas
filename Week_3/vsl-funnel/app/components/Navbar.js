"use client";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    <div className={styles.logoText}>
                        <span className={styles.logoName}>Aakash Savant</span>
                        <span className={styles.logoTag}>Retail Control Architect™</span>
                    </div>
                </div>

                <div className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
                    <a href="#problem" onClick={() => setMenuOpen(false)}>The Problem</a>
                    <a href="#system" onClick={() => setMenuOpen(false)}>The System</a>
                    <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
                    <a href="#offer" onClick={() => setMenuOpen(false)}>The Offer</a>
                    <a href="#book" className={styles.ctaLink} onClick={() => setMenuOpen(false)}>
                        Book Free Audit →
                    </a>
                </div>

                <button
                    className={styles.hamburger}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <span className={`${styles.bar} ${menuOpen ? styles.cross1 : ""}`} />
                    <span className={`${styles.bar} ${menuOpen ? styles.cross2 : ""}`} />
                    <span className={`${styles.bar} ${menuOpen ? styles.cross3 : ""}`} />
                </button>
            </div>
        </nav>
    );
}
