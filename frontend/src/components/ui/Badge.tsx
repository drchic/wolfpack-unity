export type PostType = 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'

const styles: Record<PostType, string> = {
  ANNOUNCEMENT: 'bg-accent/15 text-accent',
  NEWS: 'bg-info/15 text-info',
  BLOG: 'bg-success/15 text-success',
  VLOG: 'bg-danger/15 text-danger',
}

interface Props {
  type: PostType
}

export function Badge({ type }: Props) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${styles[type]}`}>
      {type}
    </span>
  )
}
