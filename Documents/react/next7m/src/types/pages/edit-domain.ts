import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/libs/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid id' })
  }

  if (req.method === 'PUT') {
    try {
      const updated = await prisma.domain.update({
        where: { id: Number(id) },
        data: req.body
      })

      res.status(200).json(updated)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Update failed' })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
