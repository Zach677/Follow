import { Label } from "@radix-ui/react-label"
import { PopoverPortal } from "@radix-ui/react-popover"
import {
  useGeneralSettingKey,
  useGeneralSettingValue,
} from "@renderer/atoms/settings/general"
import { Button } from "@renderer/components/ui/button"
import { Checkbox } from "@renderer/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@renderer/components/ui/popover"
import { jotaiStore } from "@renderer/lib/jotai"
import { getStorageNS } from "@renderer/lib/ns"
import { withSettingEnabled } from "@renderer/modules/settings/helper/withSettingEnable"
import { m } from "framer-motion"
import { atomWithStorage } from "jotai/utils"
import { forwardRef, Fragment, useState } from "react"

const TrustedKey = getStorageNS("trusted-external-link")
const trustedAtom = atomWithStorage(TrustedKey, [] as string[], undefined, {
  getOnInit: true,
})

const trustedDefaultLinks = new Set([
  "github.com",
  "gitlab.com",
  "google.com",
  "sspai.com",
  "x.com",
  "twitter.com",
  "diygod.me",
  "diygod.cc",

  "v2ex.com",
  "pixiv.net",
  "youtube.com",

  "bilibili.com",
  "xiaoyuzhoufm.com",
  "xlog.app",
  "rss3.io",
])

const getURLDomain = (url: string) => {
  if (URL.canParse(url)) {
    const urlObj = new URL(url)
    return urlObj.hostname
  }
  return null
}

const WarnGoToExternalLinkImpl = forwardRef<
  HTMLAnchorElement,
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
>(({ ...rest }, ref) => {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  const shouldWarn = useGeneralSettingKey("jumpOutLinkWarn")
  const handleOpen: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    rest.onClick?.(e)
    if (!shouldWarn) return
    const { href } = rest
    if (!href) return
    const domain = getURLDomain(href)

    if (
      domain &&
      !trustedDefaultLinks.has(domain) &&
      !jotaiStore.get(trustedAtom).includes(domain)
    ) {
      setOpen(true)
      e.preventDefault()
    }
  }
  const handleGo = () => {
    open()
    if (!checked) {
      return
    }

    const { href } = rest
    if (!href) return

    const domain = getURLDomain(href)
    if (domain && !jotaiStore.get(trustedAtom).includes(domain)) {
      jotaiStore.set(trustedAtom, (prev) => [...prev, domain])
    }

    function open() {
      if (!rest.href) return
      window.open(rest.href, "_blank", "noopener,noreferrer")
      setOpen(false)
    }
  }
  return (
    <Fragment>
      <Popover open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <PopoverTrigger asChild>
          <a ref={ref} {...rest} onClick={handleOpen} />
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>
            <p className="max-w-[50ch] text-sm">
              You are about to leave this site to go to an external page, do you
              trust this URL and go to it?
            </p>
            <p className="mt-2 text-center text-sm underline">{rest.href}</p>

            <div className="mt-3 flex justify-between">
              <Label className="center flex">
                <Checkbox checked={checked} onCheckedChange={setChecked} />
                <span className="ml-2 text-[13px]">Trust this domain</span>
              </Label>

              <Button
                variant="ghost"
                buttonClassName="px-4 hover:bg-accent bg-accent/10 dark:bg-accent/20 dark:hover:bg-accent/60"
                className="group gap-2"
                onClick={handleGo}
              >
                <m.i className="i-mingcute-arrow-right-line duration-200 group-hover:translate-x-4 group-hover:text-white dark:group-hover:text-inherit" />
                <span className="duration-200 group-hover:opacity-0">Go</span>
              </Button>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </Fragment>
  )
})

export const WarnGoToExternalLink = withSettingEnabled(
  useGeneralSettingValue,
  (s) => s.jumpOutLinkWarn,
)(WarnGoToExternalLinkImpl, "a")