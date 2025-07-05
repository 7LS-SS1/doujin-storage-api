import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/libs/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      const parsedId = Number(id)

      console.log('[DELETE] incoming id:', parsedId)

      if (isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid ID' })
      }

      try {
        await prisma.wpDetails.deleteMany({
          where: { domainId: parsedId }
        })
        console.log(`[DELETE] wpDetails deleted for domainId ${parsedId}`)
      } catch (wpError) {
        console.warn(`[DELETE] no wpDetails found for domainId ${parsedId}`)
      }

      try {
        console.log('[DEBUG] Try to delete Domain id', parsedId)
        await prisma.domain.delete({
          where: { id: parsedId }
        })
        console.log(`[DELETE] domain deleted for id ${parsedId}`)
      } catch (domainError) {
        console.error(`[DELETE] domain delete failed for id ${parsedId}:`, domainError)

        return res.status(500).json({
          message: domainError instanceof Error ? domainError.message : 'Failed to delete domain'
        })
      }

      return res.status(200).json({ message: 'Deleted successfully' })
    } catch (error) {
      console.error('[DELETE ERROR]', error instanceof Error ? error.message : error)

      return res.status(500).json({ message: 'Internal Server Error' })
    }
  } else {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
