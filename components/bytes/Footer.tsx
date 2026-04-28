'use client';

import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';
import { SiYoutube } from '@icons-pack/react-simple-icons';

import { Github as GithubIcon } from 'lucide-react';
import { LkLogoReduced, SlackIcon, XIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { StatusIndicator, type Status } from './StatusIndicator';

// https://support.atlassian.com/statuspage/docs/top-level-status-and-incident-impact-calculations/
type StatusMessage =
  // | 'service under maintenance' // blue
  | 'all systems operational' // success
  | 'partial system outage' // moderate
  | 'minor service outage' // moderate
  | 'degraded system service' // moderate
  | 'partially degraded service' // moderate
  | 'major system outage' // serious
  | 'unknown'; // hidden

type AllowedListIds = keyof typeof LINK_LISTS;

const STATUS_URL = 'https://status.livekit.io/index.json';
const LINK_LISTS = {
  product: [
    { label: 'Agent platform', href: 'https://livekit.io/products/agent-platform' },
    { label: 'Media server', href: 'https://github.com/livekit/livekit' },
    { label: 'SDKs', href: 'https://docs.livekit.io/reference/' },
    { label: 'Cloud dashboard', href: 'https://cloud.livekit.io' },
    { label: 'Terms of service', href: 'https://livekit.io/legal/terms-of-service' },
  ],
  resources: [
    { label: 'Documentation', href: 'https://docs.livekit.io/' },
    { label: 'Community', href: 'https://community.livekit.io' },
    { label: 'Coding agent support', href: 'https://docs.livekit.io/mcp' },
    { label: 'Brand assets', href: 'https://livekit.io/brand' },
    { label: 'Video codecs', href: 'https://livekit.io/webrtc/codecs-guide' },
    { label: 'Codec bitrates', href: 'https://livekit.io/webrtc/bitrate-guide' },
    { label: 'WebRTC browser test', href: 'https://livekit.io/webrtc/browser-test' },
    { label: 'Connection test', href: 'https://livekit.io/webrtc/connection-test' },
  ],
  company: [
    { label: 'About', href: 'https://livekit.io/about' },
    { label: 'Blog', href: 'https://livekit.io/blog' },
    { label: 'Careers', href: 'https://livekit.io/careers' },
    { label: 'Open source', href: 'https://github.com/livekit/livekit/blob/master/LICENSE' },
  ],
};

interface StatusIndicatorProps {
  overrideStatus?: StatusMessage;
}

function CloudStatusIndicator({ overrideStatus }: StatusIndicatorProps) {
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(overrideStatus ?? 'unknown');

  useEffect(() => {
    if (!overrideStatus) {
      fetch(STATUS_URL)
        .then((response) => response.json())
        .then((data) => {
          return data?.status?.description?.toLowerCase() ?? 'unknown';
        })
        .catch((error) => {
          console.error('Error fetching status:', error);
          return 'unknown';
        })
        .then((status: StatusMessage) => {
          setStatusMessage(status ?? 'unknown');
        });
    } else {
      setStatusMessage(overrideStatus);
    }
  }, [overrideStatus]);

  let status: Status;
  switch (statusMessage) {
    case 'all systems operational':
      status = 'success';
      break;
    default:
      status = 'muted';
      break;
  }

  return statusMessage !== 'unknown' ? (
    <a target="_blank" href="https://status.livekit.io">
      <StatusIndicator status={status} message={statusMessage} />
    </a>
  ) : null;
}

interface LinkListProps {
  siteRootUrl: string;
  heading: string;
  items: { label: string; href: string }[];
}

function LinkList({ siteRootUrl, heading, items }: LinkListProps) {
  return (
    <div key={heading} className="text-fg0 flex flex-col space-y-4">
      <p className="text-fg3 font-mono text-xs font-semibold tracking-widest uppercase">
        {heading}
      </p>
      {items.map(({ href, label }) => {
        const className = 'flex gap-2 items-baseline text-sm cursor-pointer hover:underline';
        const hrefWithoutSiteRootUrl = href.replace(siteRootUrl, '');
        const target = hrefWithoutSiteRootUrl.startsWith('/') ? undefined : '_blank';
        const rel = hrefWithoutSiteRootUrl.startsWith('/') ? undefined : 'noopener noreferrer';

        return (
          <NextLink
            key={label}
            rel={rel}
            target={target}
            href={hrefWithoutSiteRootUrl}
            className={className}
          >
            <span className={className}>{label}</span>
          </NextLink>
        );
      })}
    </div>
  );
}

function Link({
  children,
  href = '',
  siteRootUrl,
  ...props
}: React.ComponentProps<typeof NextLink | 'a'> & { siteRootUrl: string }) {
  const normalizedHref = String(href).replace(siteRootUrl, '');
  const target = normalizedHref.startsWith('/') ? undefined : '_blank';
  const rel = normalizedHref.startsWith('/') ? undefined : 'noopener noreferrer';

  return (
    <NextLink href={normalizedHref} target={target} rel={rel} {...props}>
      {children}
    </NextLink>
  );
}

interface FooterProps {
  siteRootUrl: string;
  themeModeToggle?: React.ReactNode;
  allowedListIds?: AllowedListIds[];
  /** @property overrideStatus: For storybook testing only */
  overrideStatus?: StatusMessage;
  className?: string;
}

export function Footer({
  siteRootUrl,
  themeModeToggle,
  allowedListIds = ['product', 'resources', 'company'],
  overrideStatus,
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('border-separator1 w-full border-t py-16', className)}>
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div className="min-w-52 flex-1 space-y-6">
          <Link siteRootUrl={siteRootUrl} href="https://livekit.io/" aria-label="LiveKit homepage">
            <div className="inline-block">
              <LkLogoReduced className="h-5 w-5" width="24" height="24" />
            </div>
          </Link>
          <p className="text-fg3 mt-1 text-sm text-balance">
            The open source framework and cloud platform for voice, video, and physical AI agents.
          </p>
          <div className="space-y-3">
            <h2 className="text-fg3 font-mono text-xs font-bold tracking-wider uppercase">
              Keep in touch
            </h2>
            <div className="flex items-center gap-3">
              <a
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/livekit"
                className="p-0.5"
              >
                <GithubIcon className="hover:text-fg0 size-4" />
              </a>
              <a
                aria-label="X"
                target="_blank"
                rel="noopener noreferrer"
                href="https://x.com/livekit"
                className="p-0.5"
              >
                <XIcon className="hover:text-fg0 size-4" />
              </a>
              <a
                aria-label="Slack"
                target="_blank"
                rel="noopener noreferrer"
                href="https://livekit.com/join-slack"
                className="p-0.5"
              >
                <SlackIcon className="hover:text-fg0 size-4" />
              </a>
              <a
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.youtube.com/@livekit_io"
                className="p-0.5"
              >
                <SiYoutube className="hover:text-fg0 size-5" />
              </a>
            </div>
          </div>
          {/* theme  mode toggle */}
          {themeModeToggle}
        </div>
        <div
          className={cn(
            'grid w-full max-w-4xl grid-cols-2 gap-x-4 gap-y-12',
            allowedListIds.length <= 3 && 'md:grid-cols-3',
            allowedListIds.length === 4 && 'lg:grid-cols-4',
            className,
          )}
        >
          {allowedListIds.includes('product') && (
            <LinkList
              key="product"
              siteRootUrl={siteRootUrl}
              heading="Products"
              items={LINK_LISTS.product}
            />
          )}
          {allowedListIds.includes('resources') && (
            <LinkList
              key="resources"
              siteRootUrl={siteRootUrl}
              heading="Resources"
              items={LINK_LISTS.resources}
            />
          )}
          {allowedListIds.includes('company') && (
            <LinkList
              key="company"
              siteRootUrl={siteRootUrl}
              heading="Company"
              items={LINK_LISTS.company}
            />
          )}
        </div>
      </div>

      <div className="border-separator1 text-fg3 mt-16 flex flex-col gap-3 border-t pt-3 text-xs lg:flex-row lg:justify-between">
        <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:gap-1">
          <p>
            © {currentYear} LiveKit. Engineered and designed worldwide. <br className="md:hidden" />{' '}
            All rights reserved.
          </p>
          <div className="mr-4 whitespace-nowrap">
            <Link
              target="_blank"
              href="https://livekit.io/legal/terms-of-service"
              siteRootUrl={siteRootUrl}
              className="hover:underline"
            >
              Terms of Service
            </Link>
            <span className="mx-1">|</span>
            <Link
              target="_blank"
              href="https://livekit.io/legal/cookie-policy"
              siteRootUrl={siteRootUrl}
              className="hover:underline"
            >
              Cookie Policy
            </Link>
            <span className="mx-1">|</span>
            <Link
              target="_blank"
              href="https://livekit.io/legal/privacy-policy"
              siteRootUrl={siteRootUrl}
              className="hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <div>
          <CloudStatusIndicator overrideStatus={overrideStatus} />
        </div>
      </div>
    </footer>
  );
}
