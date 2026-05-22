import Link from 'next/link';
import { Button } from '@/components/bytes/Button';

interface SignInButtonProps {
  callbackUrl?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

export function SignInButton({
  callbackUrl = '/',
  variant = 'primary',
  size = 'sm',
  className,
  children,
}: SignInButtonProps) {
  const href =
    callbackUrl && callbackUrl !== '/'
      ? `/sign-in?next=${encodeURIComponent(callbackUrl)}`
      : '/sign-in';
  return (
    <Link href={href} className={className}>
      <Button variant={variant} size={size}>
        {children ?? 'Sign in'}
      </Button>
    </Link>
  );
}
