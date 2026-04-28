import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/bytes/Sidebar";
import { NavLogo } from "@/components/custom/nav-logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { NavItem } from "@/components/custom/nav-item";
import { NavItemAccordion, NavBadge } from "@/components/custom/nav-item-accordion";
import { Chart5Icon, SquareGridMaginfyingGlassIcon, RobotIcon, TelephoneIcon, ArrowOutOfBoxIcon, SquareArrowInTopLeftIcon, SettingsGear2Icon, CreditCard2Icon } from "@/icons/react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-bg1">
        <SidebarHeader>
          <NavLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-1">
              <NavItem href="/" icon={<Chart5Icon className="size-5" />} label="Overview" />
              <NavItem href="/sessions" icon={<SquareGridMaginfyingGlassIcon className="size-5" />} label="Sessions" />
              <NavItem href="/agents" icon={<RobotIcon className="size-5" />} label="Agents" />
              <NavItemAccordion
                icon={<TelephoneIcon className="size-5" />}
                label="Telephony"
                items={[
                  { label: "Calls", href: "/telephony/calls" },
                  { label: "Dispatch rules", href: "/telephony/dispatch-rules" },
                  { label: "Phone numbers", href: "/telephony/phone-numbers", badge: <NavBadge>NEW</NavBadge> },
                  { label: "SIP trunks", href: "/telephony/sip-trunks" },
                ]}
              />
              <NavItem href="/egresses" icon={<ArrowOutOfBoxIcon className="size-5" />} label="Egresses" />
              <NavItem href="/ingresses" icon={<SquareArrowInTopLeftIcon className="size-5" />} label="Ingresses" />
              <NavItemAccordion
                icon={<SettingsGear2Icon className="size-5" />}
                label="Settings"
                items={[
                  { label: "Project", href: "/settings/project" },
                  { label: "Team members", href: "/settings/team-members" },
                  { label: "API keys", href: "/settings/api-keys" },
                  { label: "Webhooks", href: "/settings/webhooks" },
                ]}
              />
              <NavItem href="/billing" icon={<CreditCard2Icon className="size-5" />} label="Billing" />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex items-center justify-end p-4">
          <ThemeToggle/>
        </SidebarFooter>
      </Sidebar>
      <main className="relative flex min-h-svh flex-1 flex-col bg-bg0">
        {children}
      </main>
    </SidebarProvider>
  );
}
