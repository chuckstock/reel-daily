import { Address } from 'viem'
import { reeldailyAbi } from './reeldaily-abi'

import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

export const chain = base

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_URL),
})

function getMovie(movieId: string) {
  return publicClient.readContract({
    abi: reeldailyContract.abi,
    address: reeldailyContract.address,
    functionName: 'getMovie',
    args: [BigInt(movieId)],
  })
}

export const reeldailyContract = {
  abi: reeldailyAbi,
  address: '0x2C2103dAa29F853E7f6B8b63631607Bcf9CdAE11' as Address,
  movies: {
    get: getMovie,
    getRating: (movieId: string) => {
      return publicClient
        .readContract({
          abi: reeldailyContract.abi,
          address: reeldailyContract.address,
          functionName: 'getAverageRating',
          args: [BigInt(movieId)],
        })
        .catch(() => 0)
    },
    getReviewCount: (movieId: string) => {
      return publicClient
        .readContract({
          abi: reeldailyContract.abi,
          address: reeldailyContract.address,
          functionName: 'getReviewCount',
          args: [BigInt(movieId)],
        })
        .catch(() => 0)
    },
  },
  mintCost: {
    get: () =>
      publicClient.readContract({
        abi: reeldailyContract.abi,
        address: reeldailyContract.address,
        functionName: 'mintCost',
        args: [],
      }),
  },
}
