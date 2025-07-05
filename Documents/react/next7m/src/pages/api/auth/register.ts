import type { NextApiRequest, NextApiResponse } from 'next'

import bcrypt from 'bcrypt'

import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STAFF'
      }
    })

    return res.status(201).json({ message: 'User registered' })
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
}
