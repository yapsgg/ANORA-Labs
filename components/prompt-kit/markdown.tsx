import { cn } from "@/lib/utils"
import { memo, type ComponentProps } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"

type CodeNode = {
  position?: {
    start: { line: number }
    end: { line: number }
  }
}

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({
    className,
    children,
    ...props
  }: ComponentProps<"code"> & { node?: CodeNode }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line

    if (isInline) {
      return (
        <span
          className={cn(
            "bg-primary-foreground rounded-sm px-1 font-mono text-sm",
            className
          )}
          {...props}
        >
          {children}
        </span>
      )
    }

    return (
      <pre className={cn("bg-muted rounded-md p-4 overflow-x-auto", className)}>
        <code className="font-mono text-sm">{children}</code>
      </pre>
    )
  },
  pre: function PreComponent({ children }: ComponentProps<"pre">) {
    return <>{children}</>
  },
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  return (
    <div className={className}>
      <MemoizedMarkdownBlock
        content={children}
        components={components}
      />
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown }
