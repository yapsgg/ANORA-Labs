"use client"

import Link from "next/link"
import { LoginForm } from "@/components/login/login-form"
import { useConvexAuth } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Image from "next/image"
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/projects")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="bg-none flex min-h-svh flex-col items-center justify-center">
        <TextShimmer className='text-xs text-muted-foreground' duration={1}>
          Loading...
        </TextShimmer>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="bg-none flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="text-primary-foreground flex size-9 items-center justify-center rounded-md">
            <Image src="/logos/anora-mark.svg" alt="" aria-hidden="true" width={36} height={36} />
          </div>
          ANORA Labs
        </Link>
        <LoginForm />
        <p className="text-sm text-muted-foreground text-center">
          <a href="https://x.com/yapsgg" target="_blank" rel="noopener noreferrer" className="hover:text-primary">invest in us</a> for a landing page
        </p>
      </div>
    </div>
  )
}
