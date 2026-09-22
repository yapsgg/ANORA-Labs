"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Wallet,
  Plus,
} from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { TopupModal } from "@/components/topup-modal"
import { AccountModal } from "@/components/account-modal"
import { microsToUsd } from "@/lib/openrouter/pricing"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuthActions()
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [accountOpen, setAccountOpen] = React.useState(false)

  const balance = useQuery(api.balances.getBalance)
  const balanceMicros = balance?.balanceMicros ?? 0
  const balanceLabel = balance === undefined
    ? "…"
    : `$${microsToUsd(balanceMicros).toFixed(4)}`

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="size-3" />
                    <span>{balanceLabel}</span>
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Balance display */}
              <DropdownMenuGroup>
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Wallet className="size-4 text-muted-foreground" />
                      <span>Balance</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{balanceLabel}</span>
                  </div>
                  {balance !== undefined && balanceMicros === 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Top up to start generating
                    </p>
                  )}
                </div>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setBillingOpen(true)}
                >
                  <Plus />
                  <span>Top up balance</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setAccountOpen(true)}>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <TopupModal open={billingOpen} onOpenChange={setBillingOpen} userEmail={user.email} />

      {/* Account Modal */}
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  )
}
