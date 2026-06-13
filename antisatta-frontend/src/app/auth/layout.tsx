import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="-mb-16 z-10">
        <Link href="/" className="flex items-center">
          <img src="/imgs/Anti Satta.png" alt="Anti Satta" className="w-64 object-contain" />
        </Link>
      </div>
      
      <div className="w-full max-w-sm px-6 pb-6 pt-0">
        {children}
      </div>
    </div>
  );
}
