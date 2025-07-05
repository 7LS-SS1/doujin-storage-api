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
      console.error('[ADD ERROR]', error)

      return res.status(500).json({ message: 'Failed to add domain' })
    }
  }

  if (req.method === 'PUT') {
    console.log('id from query', req.query.id)
    console.log('incoming body', req.body)

    try {
      const {
        url,
        webType,
        group,
        host,
        domain,
        cloudflare,
        status,
        active,
        vpsDetail,
        wpActive,
        wp_user,
        wp_password
      } = req.body

      const id = Number(req.query.id)

      console.log('id from query', id)
      console.log('incoming vpsDetail', vpsDetail)

      const updated = await prisma.domain.update({
        where: { id },
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

      if (wpActive && wp_user && wp_password) {
        const wpRow = await prisma.wpDetails.findUnique({
          where: { domainId: id }
        })

        if (wpRow) {
          // update
          await prisma.wpDetails.update({
            where: { domainId: id },
            data: {
              wp_user,
              wp_password
            }
          })
        } else {
          // create
          await prisma.wpDetails.create({
            data: {
              domainId: id,
              url,
              wp_user,
              wp_password
            }
          })
        }
      }

      return res.status(200).json(updated)
    } catch (error) {
      console.error('[PUT ERROR]', error)

      return res.status(500).json({ message: 'Failed to update domain' })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
