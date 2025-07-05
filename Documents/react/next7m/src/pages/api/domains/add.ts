// src/pages/api/domains/add.ts

import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/libs/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { url, webType, group, host, domain, cloudflare, status, active, vpsDetail, wpActive } = req.body

      const created = await prisma.domain.create({
        data: {
          url,
          webType,
          group,
          host,
          domain,
          cloudflare,
          status,
          active,
          vpsDetail,
          wpActive
        }
      })

      // สร้าง wpDetails ทันทีไม่สน wpActive
      await prisma.wpDetails.create({
        data: {
          domainId: created.id,
          url,
          wp_user: '',
          wp_password: ''
        }
      })

      return res.status(200).json(created)
    } catch (error) {
      console.error('[ADD ERROR]', error instanceof Error ? error.message : error)

      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }
}
