/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BlockId } from '@adsgram/common'
import { AdsgramTask } from '@adsgram/react'
import { JSX, useRef } from 'react'
import Currency from '../Currency'

export function AsdgramTask({
  blockId,
}: {
  blockId: BlockId
}): JSX.Element | null {
  const taskRef = useRef<JSX.IntrinsicElements['adsgram-task']>(null)
  const handleReward = (event: CustomEvent<string>): void => {
    console.log('User earned reward:', event.detail)
  }

  const handleError = (event: CustomEvent<string>): void => {
    console.error('Task error:', event.detail)
  }

  // if (!customElements.get('adsgram-task')) {
  //   return null
  // }

  return (
    <AdsgramTask
      blockId={blockId}
      debug={false}
      className="adsgram-task p-2 bg-[var(--surface-container-lowest)] rounded-md font-bold"
      // @ts-expect-error
      ref={taskRef}
      onReward={handleReward}
      onError={handleError}>
      <span
        slot="reward"
        className="text-[12px] inline-flex gap-1 items-center px-2 py-1 rounded-md bg-[var(--traffic-container-rgba)] mt-2 w-fit">
        <Currency w={18} type={'traffic'} />
        1024
      </span>
      <div
        slot="button"
        className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md ml-2 uppercase cursor-pointer">
        go
      </div>
      <div
        slot="claim"
        className="font-medium flex items-center justify-center bg-[var(--warning)] text-[var(--on-warning)] px-2 py-1 rounded-md ml-2 uppercase cursor-pointer">
        claim
      </div>
      <div
        slot="done"
        className="font-medium flex items-center justify-center bg-[var(--success)] text-[var(--on-success)] px-2 py-1 rounded-md ml-2 uppercase cursor-not-allowed">
        done
      </div>
    </AdsgramTask>
  )
}
