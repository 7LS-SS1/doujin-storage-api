'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useRef } from 'react'

import Link from 'next/link'

// import { useRouter } from 'next/navigation'

// Type Imports
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input } from '@nextui-org/react'

import { Toast } from 'primereact/toast'

import EditDomainModal from './edit-domain'

import type { Mode } from '@core/types'
import Illustrations from '@components/Illustrations'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Type Domain Imports
import type { DomainType } from '@/types/domain'

// NextUI imports

const Domain = ({ mode }: { mode: Mode }) => {
  // States
  const [isLoading, setIsLoading] = useState(false)

  const [domains, setDomains] = useState<DomainType[]>([])

  const [searchQuery, setSearchQuery] = useState('')

  const toast = useRef<Toast>(null)

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  const authBackground = useImageVariant(mode, lightImg, darkImg)

  // Hooks
  // const router = useRouter()

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/domains')
        const data = await res.json()

        setDomains(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/domains')
      const data = await res.json()

      setDomains(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    console.log('Deleting domain with ID:', id)

    if (confirm('ยืนยันการลบ?')) {
      try {
        const res = await fetch(`/api/domains/delete?id=${id}`, {
          method: 'DELETE'
        })

        console.log('Deleting ID in await:', id)

        if (res.ok) {
          // reload list
          fetchDomains()
          toast.current?.show({
            severity: 'success',
            summary: 'สำเร็จ',
            detail: 'ลบโดเมนเรียบร้อย',
            life: 3000
          })
        } else {
          toast.current?.show({
            severity: 'error',
            summary: 'ผิดพลาด',
            detail: 'ไม่สามารถลบโดเมนได้',
            life: 3000
          })
        }
      } catch (err) {
        console.error(err)
        toast.current?.show({
          severity: 'error',
          summary: 'ผิดพลาด',
          detail: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          life: 3000
        })
      }
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<DomainType | null>(null)

  return (
    <div className='domain-container'>
      <h1>Domain Management</h1>
      <div className='content-wrapper w-full p-4 justify-between items-center flex gap-2'>
        <Link
          href='/'
          className='w-[250px] px-0 py-2 text-center bg-gray-200 rounded hover:bg-gray-300 transition-colors'
        >
          Back to Home
        </Link>
        <Link
          href='/domains/add-new-domain'
          className='w-[250px] px-4 py-2 text-center bg-gray-200 rounded hover:bg-gray-300 transition-colors items-center flex justify-center gap-2'
        >
          <i className='ri-add-circle-line' /> <span>Add new domains</span>
        </Link>
        <Button
          onClick={() => fetchDomains()}
          className='w-[75px] px-4 py-2 text-center bg-gray-200 rounded hover:bg-gray-300 transition-colors items-center flex justify-center gap-2'
        >
          <i className='ri-refresh-line' />
        </Button>
      </div>

      <div className='flex gap-4 mb-6 w-full max-w-2xl mx-auto items-center justify-between'>
        <label className='text-gray-700 font-medium min-w-fit'>Search Domains:</label>
        <Input
          type='text'
          placeholder='Search domain...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full p-2 font-medium  border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:ring-1 '
        />
      </div>

      {/* ตารางแสดงรายการโดเมน */}
      <Table aria-label='Domain Table' className='mb-6 w-full mx-auto p-3 border border-gray-200 rounded'>
        <TableHeader>
          <TableColumn>...</TableColumn>
          <TableColumn>URL Domains</TableColumn>
          <TableColumn>Host/Cloudflare</TableColumn>
          <TableColumn>Team</TableColumn>
          <TableColumn>Active</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody className=''>
          {isLoading ? (
            <TableRow>
              <TableCell>{null}</TableCell>
              <TableCell>{null}</TableCell>
              <TableCell className='text-center py-6 w-full' colSpan={6}>
                <span className='animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 h-10 w-10 inline-block' />
              </TableCell>
              <TableCell>{null}</TableCell>
              <TableCell>{null}</TableCell>
              <TableCell>{null}</TableCell>
            </TableRow>
          ) : (
            domains
              .filter(d => d.url.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((d, idx) => (
                <TableRow key={d.url + idx} className='hover:bg-gray-100 justify-between items-center'>
                  <TableCell className=' items-center '>
                    <Input type='checkbox' />
                  </TableCell>
                  <TableCell className='text-center justify-center'>
                    <div className='font-bold'>{d.url}</div>
                  </TableCell>
                  <TableCell className='text-center justify-center'>
                    <div className='font-bold'>{d.host}</div>
                    <div className='text-xs text-gray-500'>Cloudflare: {d.cloudflare}</div>
                  </TableCell>
                  <TableCell className='text-center justify-center'>
                    <span
                      className={`w-[100px] text-center text-xs px-2 py-1 rounded-full text-xs text-white ${(() => {
                        switch (d.group) {
                          case '7M':
                            return 'bg-yellow-600'
                          case 'Center X':
                            return 'bg-blue-600'
                          case 'RCA':
                            return 'bg-purple-600'
                          default:
                            return 'bg-gray-400'
                        }
                      })()}`}
                    >
                      {d.group ? d.group : 'Unknown Group'}
                    </span>
                  </TableCell>
                  <TableCell className='text-center justify-center'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${
                        d.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className='text-center items-center gap-2'>
                    <Button
                      onPress={() => {
                        setSelectedDomain(d)
                        setEditModalOpen(true)
                      }}
                      className='text-blue-600 hover:text-blue-800 bg-transparent items-center justify-center'
                      title='Edit Domain'
                    >
                      <i className='ri-file-edit-fill p-0' />
                    </Button>
                    <Button
                      onPress={() => handleDelete(d.id)}
                      className='text-pink-600 hover:text-pink-800 bg-transparent items-center justify-center'
                    >
                      <i className='ri-delete-bin-line p-0' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
          )}
        </TableBody>
      </Table>

      {/* wrap Modal นอก Table แต่ใน div เดียวกัน */}
      <EditDomainModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        domain={selectedDomain}
        onSave={async updated => {
          try {
            await fetch(`/api/domains/edit-domain?id=${updated.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            })
            fetchDomains()
            setEditModalOpen(false)

            toast.current?.show({
              severity: 'success',
              summary: 'สำเร็จ',
              detail: 'อัปเดตข้อมูลเรียบร้อย',
              life: 3000
            })
          } catch (err) {
            console.error(err)
          }
        }}
      />
      <Toast ref={toast} position='bottom-right' className='p-4 [&_.p-toast-message]:p-6' />
    </div>
  )
}

export default Domain
