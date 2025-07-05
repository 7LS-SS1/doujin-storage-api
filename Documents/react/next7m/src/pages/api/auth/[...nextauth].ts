import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs' // Changed to bcryptjs for better compatibility

import { prisma } from '@/libs/prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {}

        if (!email || !password) {
          throw new Error('กรุณากรอกอีเมลและรหัสผ่าน')
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !user.password) {
          throw new Error('ไม่พบบัญชีผู้ใช้')
        }

        const isValid = await compare(password, user.password)

        if (!isValid) {
          throw new Error('รหัสผ่านไม่ถูกต้อง')
        }

        const { password: _, ...userWithoutPassword } = user

        return userWithoutPassword
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) token.role = user.role

      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token?.role && session.user) session.user.role = token.role

      return session
    }
  }
}

export default NextAuth(authOptions)
