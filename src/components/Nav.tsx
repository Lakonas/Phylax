import Link from 'next/link';

export default function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', backgroundColor: '#1a1d23', color: 'white',
    }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 700, fontSize: 18 }}>
        PHYLAX
      </Link>
      <div style={{ display: 'flex', gap: 24 }}>
        <Link href="/submit" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
          Submit
        </Link>
        <Link href="/queue" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
          Queue
        </Link>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
          Dashboard
        </Link>
      </div>
    </nav>
  );
}