/** @jsxImportSource frog/jsx */

import { publicClient, reeldailyContract } from '@/contracts/reeldaily.contract'
import { Button, Frog, TextInput } from 'frog'
import { handle } from 'frog/next'
import { Address } from 'viem'
import { getTransactionReceipt } from 'viem/actions'

type State = {
  txHash: Address | null
  txStatus: 'pending' | 'confirmed' | 'failed' | 'init'
}

const app = new Frog<{ State: State }>({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
app.frame('/movies/:movie_id', async (c) => {
  const { transactionId, buttonValue } = c
  const movieId = c.req.param('movie_id')
  const movie = await fetch(
    'http://www.omdbapi.com/?t=interstellar&apikey=7433d30b'
  ).then((res) => res.json())
  const rating = await reeldailyContract.movies.getRating(movieId)

  const state = await c.deriveState(async (previousState) => {
    if (transactionId && transactionId !== '0x') {
      previousState.txHash = transactionId as Address
    }
    
    if (buttonValue === 'home') {
      previousState.txHash = null
      previousState.txStatus = 'init'
    }

    if (previousState.txStatus === 'pending' && previousState.txHash) {
      const data = await getTransactionReceipt(publicClient, {
        hash: previousState.txHash,
      })
      if (data?.blockHash) {
        previousState.txStatus = 'confirmed'
      }
    } else if (previousState.txHash && previousState.txStatus === 'init') {
      previousState.txStatus = 'pending'
    }
  })

  if (state.txStatus === 'pending') {
    return c.res({
      image: (
        <div tw='flex flex-col h-full w-full relative'>
          <img
            src={movie.Poster}
            tw='absolute top-0 bottom-0 left-0 right-0 opacity-50'
            style={{ filter: 'blur(20px)' }}
            alt='background'
          />
          <div tw='flex w-full h-full'>
            <img
              alt={movie.Title}
              src={movie.Poster}
              tw='h-full object-cover'
              height={600}
            />

            <div tw='flex flex-col pl-8 pt-8'>
              <p tw='text-6xl text-white uppercase w-full flex'>
                Minting Rating
              </p>
              <p tw='text-5xl text-white uppercase w-full flex'>
                Refresh to check status
              </p>
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button value='refresh'>🔄 Refresh</Button>,
        <Button.Link href={`https://www.onceupon.gg/${state.txHash}`}>
          View Transaction
        </Button.Link>,
      ],
    })
  }

  if (state.txStatus === 'confirmed') {
    return c.res({
      image: (
        <div tw='flex flex-col h-full w-full relative'>
          <img
            src={movie.Poster}
            tw='absolute top-0 bottom-0 left-0 right-0 opacity-50'
            style={{ filter: 'blur(20px)' }}
            alt='background'
          />
          <div tw='flex w-full h-full'>
            <img
              alt={movie.Title}
              src={movie.Poster}
              tw='h-full object-cover'
              height={600}
            />

            <div tw='flex flex-col pl-8 pt-8'>
              <p tw='text-6xl text-white uppercase w-full flex'>
                Successfully Rated {movie.Title}
              </p>
              <p tw='text-5xl text-white uppercase w-full flex'>
                Click "View" to see new rating.
              </p>
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button value='home'>View</Button>,
      ],
    })
  }

  return c.res({
    image: (
      <div tw='flex flex-col h-full w-full relative'>
        <img
          src={movie.Poster}
          tw='absolute top-0 bottom-0 left-0 right-0 opacity-50'
          style={{ filter: 'blur(20px)' }}
          alt='background'
        />
        <div tw='flex w-full h-full'>
          <img
            alt={movie.Title}
            src={movie.Poster}
            tw='h-full object-cover'
            height={600}
          />

          <div tw='flex flex-col pl-8 pt-8'>
            <p tw='text-6xl text-white uppercase w-full flex'>{movie.Title}</p>
            <p tw='text-5xl text-white uppercase w-full flex'>
              Rating: {rating.toString()}
            </p>
          </div>
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder='Rating (1-5)' />,
      <Button.Transaction target={`/movies/${movieId}/rate`}>
        Mint Rating
      </Button.Transaction>,
    ],
  })
})

app.transaction('/movies/:movie_id/rate', async (c) => {
  const { movie_id } = c.req.param()
  return c.contract({
    abi: reeldailyContract.abi,
    to: reeldailyContract.address,
    functionName: 'mintReview',
    args: [BigInt(movie_id), Number(c.inputText)],
    chainId: 'eip155:8453',
  })
})

export const GET = handle(app)
export const POST = handle(app)
