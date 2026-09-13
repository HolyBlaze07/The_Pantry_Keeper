import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__copyright">© 2026 Amealy. All rights reserved.</p>
        <nav className="footer__links">
          <a className="footer__link" href="/privacy-policy">
            Privacy Policy
          </a>
          <a className="footer__link" href="/terms-of-use">
            Terms of Use
          </a>
        </nav>
      </div>
    </footer>
  );
}
