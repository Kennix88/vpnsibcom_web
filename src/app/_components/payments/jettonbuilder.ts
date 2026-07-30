import { Address, beginCell, toNano } from '@ton/core'

const JETTON_TRANSFER_OPCODE = 0x0f8a7ea5

export function buildJettonTransferTx(params: {
  senderJettonWallet: string
  destinationOwner: string
  responseDestination: string
  amountJetton: string // decimal string, напр. "12.34"
  decimals: number
  comment: string
  gasAmount?: string // TON на газ, дефолт 0.08
}) {
  const units = BigInt(
    Math.round(parseFloat(params.amountJetton) * 10 ** params.decimals),
  )

  const forwardPayload = beginCell()
    .storeUint(0, 32)
    .storeStringTail(params.comment)
    .endCell()

  const body = beginCell()
    .storeUint(JETTON_TRANSFER_OPCODE, 32)
    .storeUint(0, 64) // query_id
    .storeCoins(units)
    .storeAddress(Address.parse(params.destinationOwner))
    .storeAddress(Address.parse(params.responseDestination))
    .storeBit(false) // custom_payload
    .storeCoins(toNano('0.000000001')) // forward_ton_amount — обязателен для transfer_notification
    .storeBit(true)
    .storeRef(forwardPayload)
    .endCell()

  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: params.senderJettonWallet,
        amount: toNano(params.gasAmount ?? '0.08').toString(),
        payload: body.toBoc().toString('base64'),
      },
    ],
  }
}
