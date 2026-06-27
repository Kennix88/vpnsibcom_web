import AdRedirect from './_components/AdRedirect'

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  return <AdRedirect adKey={key} />
}
